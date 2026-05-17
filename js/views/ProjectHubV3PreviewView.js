// =============================================================================
// TEAMTOWERS SOS V11 — v133 · PROJECT HUB V3 · PREVIEW (vista de prova UX)
// Ruta · /js/views/ProjectHubV3PreviewView.js  →  /project-hub-v3-preview
//
// Vista de demostració per testejar el nou layout de Project Hub amb 5
// subpestanyes + dropdown "Més". NO produció · sense data binding real ·
// només UX/IA validation. La migració real de ProjectHubView va a v134+.
//
// Usa · js/ui/SubmenuTabs.js (component canonical v132j+k) · alimentat amb
// dummy data inspirat al mockup v132i (cas "Forn Vall · Cooperativa").
// =============================================================================

import { renderSubmenuTabs, bindSubmenuTabs, getActiveTabFromUrl } from '../ui/SubmenuTabs.js';

const HUB_TABS = Object.freeze([
    { id: 'hub',          label: 'Hub',           icon: '🏠' },
    { id: 'map',          label: 'Map',           icon: '🗺' },
    { id: 'kanban',       label: 'Kanban',        icon: '📋' },
    { id: 'wallet',       label: 'Comptabilitat', icon: '💰' },
    { id: 'presentation', label: 'Presentation',  icon: '🎯' },
]);

const HUB_DROPDOWN = Object.freeze([
    { id: 'pacts',    label: 'Pactes (+ Legal agents)', icon: '📜' },
    { id: 'sprints',  label: 'Sprints',                 icon: '🚀' },
    { id: 'kb',       label: 'KB del projecte',         icon: '🧠' },
    { id: 'settings', label: 'Settings',                icon: '⚙' },
]);

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
        this._cleanup = null;
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
                this._renderBody();
            }, { urlParam: 'tab' });
        }
        this._renderBody();
    }

    destroy() { try { this._cleanup?.(); } catch (_) {} }

    _renderBody() {
        const body = document.getElementById('phv3Body');
        if (!body) return;
        const p = DUMMY_PROJECT;
        if (this._mode === 'hub')          body.innerHTML = this._htmlHub(p);
        else if (this._mode === 'map')     body.innerHTML = this._htmlMap(p);
        else if (this._mode === 'kanban')  body.innerHTML = this._htmlKanban(p);
        else if (this._mode === 'wallet')  body.innerHTML = this._htmlWallet(p);
        else if (this._mode === 'presentation') body.innerHTML = this._htmlPresentation(p);
        else if (this._mode === 'pacts')   body.innerHTML = this._htmlPacts(p);
        else if (this._mode === 'sprints') body.innerHTML = this._htmlSimple('🚀 Sprints', 'Roadmap + iteració del projecte · drag&drop sprints + WOs assignats.');
        else if (this._mode === 'kb')      body.innerHTML = this._htmlSimple('🧠 KB del projecte', 'Nodes/knowledge associats a aquest projecte (no global).');
        else if (this._mode === 'settings') body.innerHTML = this._htmlSimple('⚙ Settings', 'Visibility · members · stripe link · pact templates.');
        else body.innerHTML = this._htmlSimple('?', 'Tab desconeguda · ' + this._esc(this._mode));
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
