// =============================================================================
// TEAMTOWERS SOS V11 — v134 · PROJECT HUB V3 PREVIEW · IA aligned a menú
// Ruta · /js/views/ProjectHubV3PreviewView.js  →  /project-hub-v3-preview
//
// v134 · refactor de l'IA per alinear-la amb els 5 pilars del menú principal
// (crear · treballar · comptabilitzar · connectar · aprendre) + Equip (nou
// pilar al project hub) · cada tab té sub-subtabs (2-nivells) que reagrupen
// vistes globals existents en context del projecte actiu.
//
// Doc d'IA · docs/ux/v134-project-hub-ia-alignment.md
// =============================================================================

import { renderSubmenuTabs, bindSubmenuTabs, getActiveTabFromUrl } from '../ui/SubmenuTabs.js';

// ─── Nivell 1 · pilars (verbs) ──────────────────────────────────────────
const HUB_TABS = Object.freeze([
    { id: 'hub',           label: 'Hub',           icon: '🏠' },
    { id: 'crear',         label: 'Crear',         icon: '🎨' },
    { id: 'treballar',     label: 'Treballar',     icon: '🔨' },
    { id: 'comptabilitzar',label: 'Comptabilitzar',icon: '💶' },
    { id: 'connectar',     label: 'Connectar',     icon: '🔗' },
    { id: 'equip',         label: 'Equip',         icon: '👥' },
]);

const HUB_DROPDOWN = Object.freeze([
    { id: 'aprendre', label: 'Aprendre (KB projecte)',   icon: '🧠' },
    { id: 'sprints',  label: 'Sprints management',       icon: '🚀' },
    { id: 'lifecycle',label: 'Lifecycle dashboard',      icon: '🌀' },
    { id: 'settings', label: 'Settings projecte',        icon: '⚙' },
]);

// ─── Nivell 2 · sub-subtabs per pilar (alineades amb menu global) ───────
const SUBTABS = Object.freeze({
    crear: [
        { id: 'canvas',       label: 'Canvas',       icon: '🎨' },
        { id: 'pitch',        label: 'Pitch',        icon: '📣' },
        { id: 'pact',         label: 'Pacte',        icon: '🤝' },
        { id: 'presentation', label: 'Presentation', icon: '🎤' },
    ],
    treballar: [
        { id: 'map',       label: 'Map',       icon: '🗺' },
        { id: 'kanban',    label: 'Kanban',    icon: '📋' },
        { id: 'quality',   label: 'Qualitat',  icon: '🎯' },
        { id: 'sprint',    label: 'Sprint',    icon: '🐝' },
        { id: 'lifecycle', label: 'Lifecycle', icon: '🌀' },
    ],
    comptabilitzar: [
        { id: 'wallet',     label: 'Wallet',       icon: '💼' },
        { id: 'accounting', label: 'Comptes',      icon: '📒' },
        { id: 'value',      label: 'Pastís valor', icon: '🥧' },
        { id: 'invoices',   label: 'Factures',     icon: '🧾' },
        { id: 'tokenomics', label: 'Tokenomics',   icon: '🪙' },
    ],
    connectar: [
        { id: 'pacts-ext', label: 'Pactes signats',  icon: '📜' },
        { id: 'proposals', label: 'Propostes',       icon: '📝' },
        { id: 'market',    label: 'Al mercat',       icon: '🛒' },
    ],
    equip: [
        { id: 'members',     label: 'Membres',      icon: '🧬' },
        { id: 'roles',       label: 'Rols',         icon: '🤲' },
        { id: 'permissions', label: 'Permisos',     icon: '🔐' },
        { id: 'invites',     label: 'Convidacions', icon: '✉' },
    ],
});

const VALID_IDS = new Set([...HUB_TABS, ...HUB_DROPDOWN].map(t => t.id));

const DUMMY_PROJECT = Object.freeze({
    name:        'Forn Vall · Cooperativa',
    tagline:     'Forn artesà cooperatiu a la Vall de Camprodon',
    description: '12 sòcies treballadores · pa de fermentació natural · distribució directa a 4 botigues locals. Model SCCL · cicle MVP amb 3 mesos d\'operació.',
    sector: 'C',
    stage:  'MVP',
    stats:  { roles: 12, transactions: 28, wos: 7, balance: '€ 1,240' },
    canvas: {
        segments:    ['Famílies del barri', 'Botigues locals', 'Restaurants km0'],
        valueProps:  ['Pa fermentació natural', 'Cereal ecològic local', 'Preu just productors'],
        channels:    ['Botiga al forn', 'Distribució 4 botigues', 'Web ecommerce'],
        revenue:     ['Venda directa (60%)', 'Distribució (30%)', 'Subscripció caixa (10%)'],
    },
    pitch: {
        problem:  'El pa industrial inunda els pobles · no hi ha alternativa artesanal de proximitat ni model cooperatiu sostenible.',
        solution: 'Forn cooperatiu de 12 sòcies amb fermentació natural · cereal ecològic d\'agricultors locals · preu just.',
        whyNow:   'Demanda creixent d\'aliment artesà i model cooperatiu · suport públic SCCL · 4 botigues compromeses.',
        traction: '3 mesos operatius · 380€ inflow/mes · break-even projectat a mes 8.',
    },
});

export default class ProjectHubV3PreviewView {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'Project Hub V3 (preview) · SOS';
        const urlTab = getActiveTabFromUrl('tab', 'hub');
        this._mode = VALID_IDS.has(urlTab) ? urlTab : 'hub';
        // v134 · 2-nivells · sub-tab dins del pilar
        const urlSub = getActiveTabFromUrl('sub', null);
        const validSubs = SUBTABS[this._mode] || [];
        this._sub = (urlSub && validSubs.find(s => s.id === urlSub)) ? urlSub : (validSubs[0]?.id || null);
        this._cleanup = null;
        this._cleanupSub = null;
    }

    async getHtml() { return this._htmlShell(); }

    async render() {
        const app = (typeof document !== 'undefined') ? document.getElementById('app') : null;
        if (!app) return;
        app.innerHTML = await this.getHtml();
        await this.afterRender();
    }

    async afterRender() {
        const mount = document.getElementById('phv3Submenu');
        if (mount) {
            this._cleanup = bindSubmenuTabs(mount, (newId) => {
                if (!VALID_IDS.has(newId)) return;
                this._mode = newId;
                // Reset sub-tab a default del nou pilar
                const subs = SUBTABS[this._mode] || [];
                this._sub = subs[0]?.id || null;
                this._renderBody();
            }, { urlParam: 'tab' });
        }
        this._renderBody();
    }

    destroy() {
        try { this._cleanup?.(); } catch (_) {}
        try { this._cleanupSub?.(); } catch (_) {}
    }

    _renderBody() {
        const body = document.getElementById('phv3Body');
        if (!body) return;
        const p = DUMMY_PROJECT;

        // Nivell 1 sense sub-submenu · Hub és overview
        if (this._mode === 'hub') { body.innerHTML = this._htmlHub(p); return; }
        if (this._mode === 'aprendre') { body.innerHTML = this._htmlSimple('🧠 Aprendre · KB del projecte', 'Nodes / knowledge associats a aquest projecte (no global). v140+.'); return; }
        if (this._mode === 'sprints')  { body.innerHTML = this._htmlSimple('🚀 Sprints management', 'Roadmap + iteració del projecte · drag&drop sprints + WOs assignats.'); return; }
        if (this._mode === 'lifecycle'){ body.innerHTML = this._htmlSimple('🌀 Lifecycle dashboard', '10 fases · status % · next-best-action per fase.'); return; }
        if (this._mode === 'settings') { body.innerHTML = this._htmlSimple('⚙ Settings projecte', 'Visibility · stripe link · pact templates · domains.'); return; }

        // Nivell 2 · pilars amb sub-submenu (Crear · Treballar · Comptabilitzar · Connectar · Equip)
        const subs = SUBTABS[this._mode] || [];
        const subActive = (this._sub && subs.find(s => s.id === this._sub)) ? this._sub : (subs[0]?.id || null);
        this._sub = subActive;

        const subMenuHtml = subs.length > 0
            ? `<div id="phv3SubMenu" style="margin-bottom:14px;border:1px solid var(--border-default);border-radius:var(--radius-md);overflow:hidden;background:var(--bg-elevated);">${
                renderSubmenuTabs({ tabs: subs, activeId: subActive, urlParam: 'sub' })
              }</div>`
            : '';

        body.innerHTML = subMenuHtml + '<div id="phv3SubBody"></div>';

        // Bind sub-submenu · callback re-renderitza només el SubBody
        try { this._cleanupSub?.(); } catch (_) {}
        const subMount = document.getElementById('phv3SubMenu');
        if (subMount) {
            this._cleanupSub = bindSubmenuTabs(subMount, (newSub) => {
                this._sub = newSub;
                this._renderSubBody();
            }, { urlParam: 'sub' });
        }
        this._renderSubBody();
    }

    _renderSubBody() {
        const subBody = document.getElementById('phv3SubBody');
        if (!subBody) return;
        const p = DUMMY_PROJECT;
        const key = this._mode + '/' + this._sub;
        subBody.innerHTML = this._htmlForSub(key, p);
    }

    _htmlForSub(key, p) {
        // ─── 🎨 Crear ────────────────────────────────────────────────
        if (key === 'crear/canvas')       return this._htmlSimple('🎨 Canvas', 'Vision · mission · values · stakeholders · north-star (substitut futur de ProjectCanvasView).');
        if (key === 'crear/pitch')        return this._htmlSimple('📣 Pitch', 'One-pager públic shareable amb OG meta · 6 seccions.');
        if (key === 'crear/pact')         return this._htmlSimple('🤝 Pacte', 'Pacte de socis dinàmic · ECDSA signatures · primer contracte SOS.');
        if (key === 'crear/presentation') return this._htmlPresentation(p);

        // ─── 🔨 Treballar ───────────────────────────────────────────
        if (key === 'treballar/map')     return this._htmlMap(p);
        if (key === 'treballar/kanban')  return this._htmlKanban(p);
        if (key === 'treballar/quality') return this._htmlQuality(p);
        if (key === 'treballar/sprint')  return this._htmlSimple('🐝 Sprint orchestrator', 'Backlog estructurat + IA runs autonomous TDD.');
        if (key === 'treballar/lifecycle') return this._htmlSimple('🌀 Lifecycle', '10 fases del projecte · % status · next-best-action.');

        // ─── 💶 Comptabilitzar (v2 redesign · WalletV2 style) ───────
        if (key === 'comptabilitzar/wallet')     return this._htmlWallet(p);
        if (key === 'comptabilitzar/accounting') return this._htmlAccounting(p);
        if (key === 'comptabilitzar/value')      return this._htmlValuePie(p);
        if (key === 'comptabilitzar/invoices')   return this._htmlSimple('🧾 Factures', 'CRUD invoices · IVA · auto-ledger entry quan paid · print PDF.');
        if (key === 'comptabilitzar/tokenomics') return this._htmlSimple('🪙 Tokenomics', 'Disseny del token · 6 grups + vesting + quality score live (només projectes amb token config).');

        // ─── 🔗 Connectar ────────────────────────────────────────────
        if (key === 'connectar/pacts-ext') return this._htmlPacts(p);
        if (key === 'connectar/proposals') return this._htmlSimple('📝 Propostes', 'IA brief + skill matching + PDF · win rate tracker (filtrat per projecte).');
        if (key === 'connectar/market')    return this._htmlSimple('🛒 Al mercat', 'Aquest projecte publicat al mercat · productes/serveis/sops oferits + traction.');

        // ─── 👥 Equip ────────────────────────────────────────────────
        if (key === 'equip/members')     return this._htmlTeamMembers(p);
        if (key === 'equip/roles')       return this._htmlTeamRoles(p);
        if (key === 'equip/permissions') return this._htmlTeamPermissions(p);
        if (key === 'equip/invites')     return this._htmlTeamInvites(p);

        return this._htmlSimple('?', 'Sub-tab desconeguda · ' + this._esc(key));
    }

    _htmlShell() {
        const p = DUMMY_PROJECT;
        return `
        <div style="max-width:1100px;margin:0 auto;padding:20px;">
            <div style="background:rgba(168,85,247,0.10);border:1px solid var(--accent-purple);border-radius:var(--radius-md);padding:10px 14px;margin-bottom:16px;font-size:0.85rem;color:var(--text-secondary);">
                <strong style="color:var(--accent-purple);">🧪 PREVIEW v133</strong> · Aquesta és una vista de proves UX · dummy data (cas Forn Vall) · valida el layout del nou Project Hub abans de la migració real a v134. Comparteix l'URL <code>?tab=presentation</code> per testar URL sync.
            </div>

            <div style="background:var(--bg-panel);border:1px solid var(--border-default);border-radius:var(--radius-lg);overflow:hidden;">
                <div style="padding:16px 18px;background:var(--bg-dark);border-bottom:1px solid var(--border-default);">
                    <h1 style="margin:0 0 4px;font-size:1.4rem;">${this._esc(p.name)}</h1>
                    <div style="color:var(--text-muted);font-size:0.85rem;">Sector ${this._esc(p.sector)} · ${this._esc(p.stage)} · ${this._esc(p.tagline)}</div>
                </div>

                <div id="phv3Submenu">${renderSubmenuTabs({ tabs: HUB_TABS, dropdown: HUB_DROPDOWN, activeId: this._mode, urlParam: 'tab' })}</div>

                <div id="phv3Body" style="padding:22px;min-height:380px;"></div>
            </div>
        </div>`;
    }

    _htmlHub(p) {
        return `
            <h2 style="margin:0 0 12px;">🏠 Hub · estat del projecte</h2>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
                ${this._kpi('Rols', p.stats.roles)}
                ${this._kpi('Transaccions', p.stats.transactions)}
                ${this._kpi('WOs actius', p.stats.wos)}
                ${this._kpi('Saldo', p.stats.balance)}
            </div>
            <p style="color:var(--text-muted);margin-top:16px;">Activity stream · contribucions recents · alerts del projecte. (placeholder · v134 reemplaça amb dades reals via KB query)</p>`;
    }

    _htmlMap() {
        return `
            <h2 style="margin:0 0 12px;">🗺 Map · ValueMapView integrat</h2>
            <p style="color:var(--text-muted);">ValueMapView renderitzat aquí com a subvista (avui navega a /value-map/:id). Castell + rols + transaccions + edició inline · zero canvi de ruta.</p>
            <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:18px;margin-top:12px;display:flex;justify-content:space-between;align-items:center;">
                <div style="color:var(--text-secondary);font-size:0.9rem;">🏛 6 nivells castell · 12 rols · 28 transaccions</div>
                <a href="/value-map/preview" data-link style="color:var(--accent-indigo);text-decoration:none;font-weight:600;">Obre ValueMapView complet →</a>
            </div>`;
    }

    _htmlKanban(p) {
        return `
            <h2 style="margin:0 0 12px;">📋 Kanban · WOs / tasks</h2>
            <p style="color:var(--text-muted);">Vista kanban dels WOs del projecte · filtres per role o fase · drag&drop status.</p>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:12px;">
                ${this._kpi('Backlog', 12)}
                ${this._kpi('In progress', 5)}
                ${this._kpi('Review', 3)}
                ${this._kpi('Done', 42)}
            </div>`;
    }

    _htmlWallet(p) {
        return `
            <h2 style="margin:0 0 12px;">💰 Comptabilitat valor + Wallet (del projecte)</h2>
            <p style="color:var(--text-muted);">Top · saldo + flow setmanal. Bottom · ledger contribucions per membre · filtre slicing-pie multipliers.</p>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:12px;">
                ${this._kpi('Saldo wallet', p.stats.balance)}
                ${this._kpi('Inflow mes', '+€ 380', 'var(--accent-green)')}
                ${this._kpi('Outflow mes', '−€ 120', 'var(--accent-red)')}
                ${this._kpi('Slicing pie %', '100%')}
            </div>`;
    }

    _htmlPresentation(p) {
        const c = p.canvas, pi = p.pitch;
        return `
            <div style="background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.15));border:1px solid var(--accent-indigo);border-radius:var(--radius-lg);padding:22px;">
                <h2 style="margin:0 0 6px;font-size:1.5rem;">${this._esc(p.name)}</h2>
                <div style="color:var(--accent-purple);font-weight:600;margin-bottom:10px;">${this._esc(p.tagline)}</div>
                <p style="color:var(--text-secondary);margin:0;">${this._esc(p.description)}</p>
            </div>

            ${this._presSection('Canvas · estructura BMC simplificada', `
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
                    ${this._canvasCell('Segments',          c.segments)}
                    ${this._canvasCell('Value Propositions', c.valueProps)}
                    ${this._canvasCell('Channels',          c.channels)}
                    ${this._canvasCell('Revenue Streams',   c.revenue)}
                </div>`)}

            ${this._presSection('Pitch · narrativa', `
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
                    ${this._pitchCell('PROBLEM',  pi.problem)}
                    ${this._pitchCell('SOLUTION', pi.solution)}
                    ${this._pitchCell('WHY NOW',  pi.whyNow)}
                    ${this._pitchCell('TRACTION', pi.traction)}
                </div>`)}

            ${this._presSection('Map preview · estructura castell', `
                <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:14px;display:flex;justify-content:space-between;align-items:center;">
                    <div style="color:var(--text-secondary);font-size:0.9rem;">🏛 6 nivells castell · ${p.stats.roles} rols · ${p.stats.transactions} transaccions</div>
                    <a href="/value-map/preview" data-link style="color:var(--accent-indigo);text-decoration:none;font-weight:600;font-size:0.9rem;">Veure mapa complet →</a>
                </div>`)}

            ${this._presSection('CTA', `
                <div style="display:flex;gap:10px;">
                    <button style="padding:10px 18px;border-radius:var(--radius-md);border:none;background:var(--accent-indigo);color:#fff;font-weight:700;cursor:pointer;">📧 Contacta</button>
                    <button style="padding:10px 18px;border-radius:var(--radius-md);border:1px solid var(--border-default);background:transparent;color:var(--text-main);font-weight:700;cursor:pointer;">📜 Signa un pacte</button>
                    <button style="padding:10px 18px;border-radius:var(--radius-md);border:1px solid var(--border-default);background:transparent;color:var(--text-main);font-weight:700;cursor:pointer;">🧠 Explora KB</button>
                </div>`)}`;
    }

    // v134 · 🎯 Quality (integració de ProjectQualityView · rubric 12-criteris)
    _htmlQuality(p) {
        return `
            <h2 style="margin:0 0 12px;">🎯 Qualitat · rubric 12-criteris + integritat 7-regles</h2>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
                ${this._kpi('Score global', '78/100', 'var(--accent-orange)')}
                ${this._kpi('Integritat', '6/7', 'var(--accent-green)')}
                ${this._kpi('Criteris rubric', '9/12', 'var(--accent-indigo)')}
            </div>
            <div style="margin-top:14px;background:var(--bg-elevated);border-radius:var(--radius-md);padding:14px;">
                <strong style="color:var(--accent-orange);">⚠ 3 criteris pendents</strong>
                <ul style="margin:8px 0 0;padding-left:18px;font-size:0.88rem;">
                    <li>Pitch sense "why now" explícit · falta seció</li>
                    <li>Wallet sense balance setmanal · cal calibrar flow tracker</li>
                    <li>Map sense rol "scout" tot i ser cooperativa amb cantera</li>
                </ul>
            </div>
            <p style="color:var(--text-muted);margin-top:12px;">Substitut futur de ProjectQualityView · redirect /quality → /project/:id?tab=treballar&sub=quality.</p>`;
    }

    // v134 · 💶 Accounting v2 redesign
    _htmlAccounting(p) {
        return `
            <h2 style="margin:0 0 12px;">📒 Comptes · ledger v2</h2>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
                ${this._kpi('Actius', '€ 2,150')}
                ${this._kpi('Passius', '€ 910')}
                ${this._kpi('Equity', '€ 1,240', 'var(--accent-green)')}
                ${this._kpi('P&L mes', '+€ 260', 'var(--accent-green)')}
            </div>
            <div style="margin-top:14px;background:var(--bg-elevated);border-radius:var(--radius-md);padding:14px;">
                <strong>Últimes 5 entrades</strong>
                <div style="margin-top:8px;font-family:var(--font-mono);font-size:0.82rem;display:grid;gap:6px;">
                    <div>2026-05-15 · Venda diumenge · +€ 95 · Caixa</div>
                    <div>2026-05-14 · Cereal Marc · −€ 42 · Compres</div>
                    <div>2026-05-12 · Distrib. Botiga Vall · +€ 180 · Distribució</div>
                    <div>2026-05-10 · Lloguer maig · −€ 320 · Operatives</div>
                    <div>2026-05-08 · Subscripcions caixa · +€ 60 · Subscripcions</div>
                </div>
            </div>
            <p style="color:var(--text-muted);margin-top:12px;">Filter per membre / categoria · export CSV (v138).</p>`;
    }

    // v134 · 🥧 Pastís valor (slicing pie + multiplicadors Moyer)
    _htmlValuePie(p) {
        return `
            <h2 style="margin:0 0 12px;">🥧 Pastís de valor · Slicing Pie + multiplicadors Moyer</h2>
            <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:14px;">
                <div style="display:flex;flex-direction:column;gap:8px;font-size:0.88rem;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span><strong>Maria</strong> · founder · idea + 3 mesos × 1.5</span>
                        <span style="color:var(--accent-green);font-weight:700;">42%</span>
                    </div>
                    <div style="background:rgba(34,197,94,0.18);height:6px;border-radius:3px;width:42%;"></div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
                        <span><strong>Pau</strong> · ops · 3 mesos × 1.0</span>
                        <span style="color:var(--accent-indigo);font-weight:700;">28%</span>
                    </div>
                    <div style="background:rgba(99,102,241,0.18);height:6px;border-radius:3px;width:28%;"></div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
                        <span><strong>Laura</strong> · contributor · 2 mesos × 1.0 + capital € 500 × 4.0</span>
                        <span style="color:var(--accent-purple);font-weight:700;">30%</span>
                    </div>
                    <div style="background:rgba(168,85,247,0.18);height:6px;border-radius:3px;width:30%;"></div>
                </div>
            </div>
            <p style="color:var(--text-muted);margin-top:12px;">Recalcula en temps real quan canvien contribucions · doc · knowledge/vision/slicing-pie-mike-moyer.md.</p>`;
    }

    // v134 · 👥 Equip · Members
    _htmlTeamMembers(p) {
        return `
            <h2 style="margin:0 0 12px;">🧬 Membres · qui hi participa</h2>
            <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:14px;display:grid;gap:10px;">
                ${this._teamMemberRow('Maria',  'founder',     'did:sos:maria',  4500, 'var(--accent-green)')}
                ${this._teamMemberRow('Pau',    'ops',         'did:sos:pau',    2800, 'var(--accent-indigo)')}
                ${this._teamMemberRow('Laura',  'contributor', 'did:sos:laura',  3000, 'var(--accent-purple)')}
                ${this._teamMemberRow('Marc',   'viewer',      'did:sos:marc',     0,  'var(--text-muted)')}
            </div>
            <button style="margin-top:14px;padding:10px 18px;border-radius:var(--radius-md);border:none;background:var(--accent-indigo);color:#fff;font-weight:700;cursor:pointer;">+ Convida nou membre</button>`;
    }

    _teamMemberRow(name, role, did, slices, color) {
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-left:3px solid ${color};background:var(--bg-panel);border-radius:var(--radius-sm);">
            <div>
                <strong>${this._esc(name)}</strong>
                <span style="margin-left:8px;font-size:0.78rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;">${this._esc(role)}</span>
                <div style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-muted);margin-top:2px;">${this._esc(did)}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-weight:700;color:${color};">${slices} slices</div>
                <div style="font-size:0.72rem;color:var(--text-muted);">${this._esc(role) === 'viewer' ? 'sense contribucions' : 'actiu'}</div>
            </div>
        </div>`;
    }

    // v134 · 👥 Equip · Rols
    _htmlTeamRoles(p) {
        const roles = [
            { id: 'founder',     label: 'Founder',     desc: 'Tots els permisos · creador del projecte',                 can: '*' },
            { id: 'ops',         label: 'Operations',  desc: 'Editar canvas · claim WOs · approve WOs propis',           can: 'read.* · edit.canvas · claim.wos · approve.wos.own' },
            { id: 'contributor', label: 'Contributor', desc: 'Pot reclamar WOs i veure tot · sense editar artefactes',   can: 'read.* · claim.wos' },
            { id: 'viewer',      label: 'Viewer',      desc: 'Lectura limitada · canvas + presentation només',           can: 'read.canvas · read.presentation' },
            { id: 'invited',     label: 'Invited',     desc: 'Pendent d\'acceptar invitació · sense accés actiu',         can: '—' },
        ];
        return `
            <h2 style="margin:0 0 12px;">🤲 Rols · catàleg + permisos</h2>
            <div style="display:grid;gap:8px;">
                ${roles.map(r => `
                    <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px;border-left:3px solid var(--accent-indigo);">
                        <div style="display:flex;justify-content:space-between;align-items:baseline;">
                            <strong>${this._esc(r.label)}</strong>
                            <code style="font-size:0.75rem;color:var(--text-muted);">${this._esc(r.id)}</code>
                        </div>
                        <div style="color:var(--text-secondary);font-size:0.85rem;margin-top:4px;">${this._esc(r.desc)}</div>
                        <div style="font-family:var(--font-mono);font-size:0.78rem;color:var(--accent-green);margin-top:6px;">can · ${this._esc(r.can)}</div>
                    </div>`).join('')}
            </div>
            <button style="margin-top:14px;padding:10px 18px;border-radius:var(--radius-md);border:1px solid var(--border-default);background:transparent;color:var(--text-main);font-weight:700;cursor:pointer;">+ Crear rol custom</button>`;
    }

    // v134 · 👥 Equip · Permisos (matriu)
    _htmlTeamPermissions(p) {
        const perms = [
            { kind: 'read.canvas',       founder: '✓', ops: '✓', contributor: '✓', viewer: '✓' },
            { kind: 'read.presentation', founder: '✓', ops: '✓', contributor: '✓', viewer: '✓' },
            { kind: 'edit.canvas',       founder: '✓', ops: '✓', contributor: '–', viewer: '–' },
            { kind: 'edit.pact',         founder: '✓', ops: '–', contributor: '–', viewer: '–' },
            { kind: 'claim.wos',         founder: '✓', ops: '✓', contributor: '✓', viewer: '–' },
            { kind: 'approve.wos',       founder: '✓', ops: '✓ (propis)', contributor: '–', viewer: '–' },
            { kind: 'manage.finances',   founder: '✓', ops: '–', contributor: '–', viewer: '–' },
            { kind: 'manage.members',    founder: '✓', ops: '–', contributor: '–', viewer: '–' },
        ];
        return `
            <h2 style="margin:0 0 12px;">🔐 Permisos · matriu rol × acció (in-project)</h2>
            <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.85rem;background:var(--bg-elevated);border-radius:var(--radius-md);overflow:hidden;">
                <thead>
                    <tr style="background:var(--bg-panel);">
                        <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--border-default);">Permís</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--border-default);">Founder</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--border-default);">Ops</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--border-default);">Contributor</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--border-default);">Viewer</th>
                    </tr>
                </thead>
                <tbody>${perms.map(r => `
                    <tr>
                        <td style="padding:8px 12px;border-bottom:1px solid var(--border-default);"><code>${this._esc(r.kind)}</code></td>
                        <td style="text-align:center;padding:8px 12px;border-bottom:1px solid var(--border-default);">${this._esc(r.founder)}</td>
                        <td style="text-align:center;padding:8px 12px;border-bottom:1px solid var(--border-default);">${this._esc(r.ops)}</td>
                        <td style="text-align:center;padding:8px 12px;border-bottom:1px solid var(--border-default);">${this._esc(r.contributor)}</td>
                        <td style="text-align:center;padding:8px 12px;border-bottom:1px solid var(--border-default);">${this._esc(r.viewer)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
            </div>
            <p style="color:var(--text-muted);margin-top:12px;">RBAC base · role overrides per WO específic possibles (v140+). Aquest model viu a /team global també.</p>`;
    }

    // v134 · 👥 Equip · Convidacions
    _htmlTeamInvites(p) {
        return `
            <h2 style="margin:0 0 12px;">✉ Convidacions pendents</h2>
            <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:14px;display:grid;gap:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--bg-panel);border-radius:var(--radius-sm);border-left:3px solid var(--accent-orange);">
                    <div>
                        <strong>pau@vall.com</strong>
                        <div style="font-size:0.78rem;color:var(--text-muted);">rol · contributor · expira en 3 dies</div>
                    </div>
                    <button style="background:var(--accent-red);color:#fff;border:none;padding:6px 12px;border-radius:var(--radius-sm);font-weight:700;font-size:0.8rem;cursor:pointer;">🗑 Cancel·la</button>
                </div>
            </div>
            <button style="margin-top:14px;padding:10px 18px;border-radius:var(--radius-md);border:none;background:var(--accent-indigo);color:#fff;font-weight:700;cursor:pointer;">+ Crear nova convidació</button>`;
    }

    _htmlPacts() {
        return `
            <h2 style="margin:0 0 12px;">📜 Pactes (+ Legal agents drawer)</h2>
            <p style="color:var(--text-muted);">Vista pacts del projecte + signatura · el doc generator amb legal agents viu aquí com a subsecció (drawer/modal) · no com a vista standalone.</p>
            <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:18px;margin-top:12px;display:flex;flex-direction:column;gap:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <strong>Pacte · Distribució 30%</strong>
                    <span style="color:var(--accent-green);font-size:0.8rem;">✓ Signat</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <strong>Pacte · Subscripció caixa</strong>
                    <button style="background:var(--accent-orange);color:#fff;border:none;padding:6px 12px;border-radius:var(--radius-sm);font-weight:700;font-size:0.8rem;cursor:pointer;">📝 Generar doc amb IA legal</button>
                </div>
            </div>`;
    }

    _htmlSimple(title, desc) {
        return `<h2 style="margin:0 0 12px;">${this._esc(title)}</h2><p style="color:var(--text-muted);">${this._esc(desc)}</p>`;
    }

    _kpi(label, value, color) {
        return `<div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px;">
            <div style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em;">${this._esc(label)}</div>
            <div style="font-size:1.4rem;font-weight:700;margin-top:4px;${color ? 'color:' + color + ';' : ''}">${this._esc(value)}</div>
        </div>`;
    }

    _presSection(title, inner) {
        return `<div style="margin-top:18px;">
            <h4 style="color:var(--accent-indigo);font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;font-weight:700;margin:0 0 8px;">${this._esc(title)}</h4>
            ${inner}
        </div>`;
    }

    _canvasCell(title, items) {
        return `<div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px;border-left:3px solid var(--accent-indigo);">
            <h5 style="font-size:0.78rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;margin:0 0 6px;">${this._esc(title)}</h5>
            <ul style="margin:0;padding-left:14px;font-size:0.85rem;">${items.map(i => '<li>' + this._esc(i) + '</li>').join('')}</ul>
        </div>`;
    }

    _pitchCell(label, text) {
        return `<div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px;border-left:3px solid var(--accent-orange);">
            <div style="font-size:0.72rem;color:var(--accent-orange);font-weight:700;letter-spacing:0.08em;margin:0 0 4px;">${this._esc(label)}</div>
            <p style="font-size:0.88rem;color:var(--text-main);margin:0;line-height:1.45;">${this._esc(text)}</p>
        </div>`;
    }

    _esc(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
}
