// =============================================================================
// TEAMTOWERS SOS V11 — SETTINGS V2 (UX-C · sprint settings unificades)
// Ruta · /js/views/SettingsV2View.js  →  /settings (canònic post-Fase B)
//    · /settings-v2 redirigeix a /settings via LEGACY_REDIRECTS
//
// Settings unificades amb tabs · agrupa configuracions disperses en 1 sol
// lloc · cap tab ≥ 7 items (Miller's Law).
//
// Tabs (5) ·
//   1. 🔑 API keys IA · Anthropic · OpenAI · Gemini · DeepSeek · Minimax
//   2. 🎨 Tema · Dark / Light / Coop
//   3. 🤖 IA defaults · tier per defecte · budget mensual per projecte
//   4. 🌐 Permaweb · Wander wallet · keyfile · mode test
//   5. 💾 Backup · Export / Import / Reset
//
// El /settings clàssic (813L) queda backwards-compat per ara · banner
// "🆕 Settings V2" afegit per a discovery.
// =============================================================================

import { KB } from '../core/kb.js';
import { loadCurrentTheme, saveTheme, applyThemeToDocument } from '../core/themeService.js';
import { toast } from '../core/uxComponents.js';
import { setBudget, getBudget, budgetStatus, _resetAll as resetBudget } from '../core/aiBudgetService.js';
import { renderTierIndicatorHtml } from '../core/aiTierIndicator.js';
import { renderCanonicalBadge } from '../core/deprecatedBanner.js';
import {
    SOS_PLANS, VALID_PLAN_IDS, DEFAULT_TOPUP_AMOUNTS,
    validatePublishableKey, detectKeyType, validatePaymentLinkUrl,
    loadStripeConfig, saveStripeConfig, loadCurrentPlan, setCurrentPlan,
    openTopupPaymentLink,
} from '../core/stripeService.js';
import {
    loadManifesto, saveManifesto, restoreDefaultManifesto,
    isDefaultManifesto, SOS_MANIFESTO,
} from '../core/sosManifesto.js';
import {
    exportSnapshot, importSnapshot, downloadSnapshotJson, readSnapshotFromFile,
} from '../core/projectIO.js';

export default class SettingsV2View {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'Settings v2 · SOS';
        this._activeTab = 'api-keys';
    }

    async getHtml() {
        const currentTheme = await loadCurrentTheme(KB).catch(() => 'dark');
        const apiKeys = await this._loadApiKeys();
        const defaultBudget = getBudget('default-global') || 5.0;
        // V2-EVOL Fase B · features migrades de SettingsView V1
        const stripeCfg   = await loadStripeConfig(KB).catch(() => ({ publishableKey: '', paymentLinks: {} }));
        const currentPlan = await loadCurrentPlan(KB).catch(() => null) || { planId: 'free', walletBalanceEur: 0 };
        const manifesto   = await loadManifesto(KB).catch(() => ({ text: SOS_MANIFESTO, isDefault: true, exists: false }));

        this._state = { currentTheme, apiKeys, defaultBudget, stripeCfg, currentPlan, manifesto };
        return this._renderShell({ currentTheme, apiKeys, defaultBudget, stripeCfg, currentPlan, manifesto });
    }

    async afterRender() {
        this._bindTabs();
        this._bindActions();
        // Pre-fill provider select amb el current
        try {
            const { Orchestrator } = await import('../core/Orchestrator.js');
            const current = await Orchestrator.getDefaultProvider();
            const sel = document.getElementById('sv2DefaultProvider');
            if (sel && current) sel.value = current;
        } catch (_) {}
    }

    async render() {
        const app = (typeof document !== 'undefined') ? document.getElementById('app') : null;
        if (!app) return;
        app.innerHTML = await this.getHtml();
        await this.afterRender();
    }

    _renderShell({ currentTheme, apiKeys, defaultBudget, stripeCfg, currentPlan, manifesto }) {
        return `
        <style>
            .sv2-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); padding-bottom:2rem; }
            .sv2-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-wrap:wrap; }
            .sv2-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .sv2-logo span { color:var(--accent-indigo); }
            .sv2-back { color:var(--text-secondary); font-size:0.78rem; padding:4px 10px; border-radius:4px; text-decoration:none; }
            .sv2-back:hover { color:var(--text-main); background:var(--glass-hover); }

            .sv2-main { max-width:880px; margin:0 auto; padding:1.2rem 1rem; }
            .sv2-tabs { display:flex; gap:4px; border-bottom:1px solid var(--border-default); margin-bottom:1.2rem; overflow-x:auto; }
            .sv2-tab { padding:10px 16px; background:transparent; color:var(--text-secondary); border:0; border-bottom:2px solid transparent; cursor:pointer; font-size:0.85rem; font-weight:600; white-space:nowrap; transition:all 0.15s; }
            .sv2-tab:hover { color:var(--text-main); }
            .sv2-tab.active { color:var(--text-main); border-bottom-color:var(--accent-indigo); }

            .sv2-panel { display:none; }
            .sv2-panel.active { display:block; }

            .sv2-section { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem 1.2rem; margin-bottom:0.8rem; }
            .sv2-section h2 { margin:0 0 0.6rem 0; font-size:0.95rem; color:var(--text-main); }
            .sv2-section p { margin:0 0 0.6rem 0; font-size:0.82rem; color:var(--text-secondary); line-height:1.55; }

            .sv2-row { display:flex; gap:8px; align-items:center; margin-bottom:0.6rem; flex-wrap:wrap; }
            .sv2-label { font-size:0.78rem; font-weight:600; color:var(--text-main); min-width:120px; }
            .sv2-input { flex:1; min-width:200px; padding:7px 10px; background:var(--bg-dark); color:var(--text-main); border:1px solid var(--border-default); border-radius:4px; font-family:var(--font-mono); font-size:0.82rem; }
            .sv2-input:focus { outline:2px solid var(--accent-indigo); outline-offset:1px; }
            .sv2-btn { padding:7px 14px; border-radius:4px; border:1px solid var(--border-default); background:var(--bg-panel); color:var(--text-main); font-size:0.78rem; font-weight:600; cursor:pointer; }
            .sv2-btn:hover { background:var(--glass-hover); border-color:var(--accent-indigo); }
            .sv2-btn-primary { background:linear-gradient(135deg,#a855f7,#6366f1); color:#fff; border-color:transparent; }
            .sv2-btn-primary:hover { filter:brightness(1.1); }
            .sv2-btn-danger { background:rgba(239,68,68,0.15); color:#ef4444; border-color:rgba(239,68,68,0.3); }
            .sv2-btn-danger:hover { background:rgba(239,68,68,0.25); }

            .sv2-pill { padding:2px 8px; border-radius:999px; font-size:0.65rem; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; }
            .sv2-pill.ok    { background:rgba(34,197,94,0.18); color:#22c55e; }
            .sv2-pill.warn  { background:rgba(250,204,21,0.18); color:#facc15; }
            .sv2-pill.err   { background:rgba(239,68,68,0.18); color:#ef4444; }

            .sv2-theme-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:0.5rem; }
            .sv2-theme-card { padding:0.8rem 1rem; border-radius:6px; border:2px solid var(--border-default); cursor:pointer; text-align:center; background:var(--bg-dark); transition:all 0.15s; }
            .sv2-theme-card.active { border-color:var(--accent-indigo); background:rgba(99,102,241,0.10); }
            .sv2-theme-card .ic { font-size:1.6rem; line-height:1; margin-bottom:4px; }
            .sv2-theme-card .nm { font-weight:700; font-size:0.85rem; }
            .sv2-theme-card .ds { font-size:0.7rem; color:var(--text-secondary); margin-top:2px; }

            .sv2-deeplink { color:var(--accent-indigo); text-decoration:none; font-size:0.78rem; }
            .sv2-deeplink:hover { text-decoration:underline; }
        </style>

        <div class="sv2-shell">
            <div class="sv2-topbar">
                <a href="/home" data-link class="sv2-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Settings</span>
                ${renderCanonicalBadge({ label: 'V2 · oficial', title: 'Versió canónica · 7 tabs · totes les features migrades de V1.' })}
                <span style="flex:1;"></span>
            </div>

            <div class="sv2-main">
                <div class="sv2-tabs" role="tablist">
                    <button class="sv2-tab active" data-tab="api-keys" role="tab">🔑 API keys</button>
                    <button class="sv2-tab" data-tab="theme" role="tab">🎨 Tema</button>
                    <button class="sv2-tab" data-tab="ai-defaults" role="tab">🤖 IA</button>
                    <button class="sv2-tab" data-tab="payments" role="tab">💳 Pagaments</button>
                    <button class="sv2-tab" data-tab="permaweb" role="tab">🌐 Permaweb</button>
                    <button class="sv2-tab" data-tab="manifesto" role="tab">📜 Manifesto</button>
                    <button class="sv2-tab" data-tab="backup" role="tab">💾 Backup</button>
                </div>

                <div class="sv2-panel active" data-panel="api-keys">
                    ${this._renderApiKeysPanel(apiKeys)}
                </div>
                <div class="sv2-panel" data-panel="theme">
                    ${this._renderThemePanel(currentTheme)}
                </div>
                <div class="sv2-panel" data-panel="ai-defaults">
                    ${this._renderAiDefaultsPanel(defaultBudget)}
                </div>
                <div class="sv2-panel" data-panel="payments">
                    ${this._renderPaymentsPanel(stripeCfg, currentPlan)}
                </div>
                <div class="sv2-panel" data-panel="permaweb">
                    ${this._renderPermawebPanel()}
                </div>
                <div class="sv2-panel" data-panel="manifesto">
                    ${this._renderManifestoPanel(manifesto)}
                </div>
                <div class="sv2-panel" data-panel="backup">
                    ${this._renderBackupPanel()}
                </div>
            </div>
        </div>`;
    }

    _renderApiKeysPanel(apiKeys) {
        const PROVIDERS = [
            { id: 'anthropic', label: 'Anthropic (Claude)', placeholder: 'sk-ant-api03-...', help: 'Crear key · console.anthropic.com' },
            { id: 'openai',    label: 'OpenAI (GPT)',       placeholder: 'sk-...',          help: 'Crear key · platform.openai.com' },
            { id: 'gemini',    label: 'Google (Gemini)',    placeholder: 'AIza...',         help: 'Crear key · aistudio.google.com' },
            { id: 'deepseek',  label: 'DeepSeek',           placeholder: 'sk-...',          help: 'Crear key · platform.deepseek.com' },
            { id: 'minimax',   label: 'Minimax',            placeholder: 'eyJh...',         help: 'Crear key · platform.minimaxi.com' },
        ];
        return `
        <div class="sv2-section">
            <h2>🔑 API keys per a agents IA</h2>
            <p>Les claus es guarden <strong>només local-first</strong> al teu navegador · mai surten del teu device. Necessàries per a usar el meta-orquestrador IA (cost + tier dinàmic · cache · evaluator).</p>
            ${PROVIDERS.map(p => {
                const has = apiKeys[p.id];
                const masked = has ? '••••••••' + has.slice(-4) : '';
                return `
                <div class="sv2-row">
                    <span class="sv2-label">${p.label}</span>
                    <input class="sv2-input" type="password" data-apikey="${p.id}" placeholder="${p.placeholder}" value="${masked ? '' : ''}" autocomplete="off">
                    <button class="sv2-btn" data-apikey-save="${p.id}">${has ? '↻ Update' : '💾 Save'}</button>
                    ${has ? `<button class="sv2-btn sv2-btn-danger" data-apikey-clear="${p.id}">✕ Esborra</button>` : ''}
                    <span class="sv2-pill ${has ? 'ok' : 'warn'}">${has ? 'configurat' : 'no config'}</span>
                </div>
                <div style="font-size:0.7rem;color:var(--text-secondary);margin:-2px 0 0.6rem 128px;">${p.help}</div>
                `;
            }).join('')}
        </div>`;
    }

    _renderThemePanel(currentTheme) {
        const THEMES = [
            { id: 'dark',  ic: '🌙', nm: 'Fosc',  ds: 'Default · low-glare' },
            { id: 'light', ic: '☀️', nm: 'Clar',  ds: 'High contrast diurn' },
            { id: 'coop',  ic: '🤝', nm: 'Coop',  ds: 'Earth tones · cooperatius' },
        ];
        return `
        <div class="sv2-section">
            <h2>🎨 Tema visual</h2>
            <p>El tema s'aplica immediatament i es desa local. Selecciona el que prefereixis.</p>
            <div class="sv2-theme-grid">
                ${THEMES.map(t => `
                    <div class="sv2-theme-card ${currentTheme === t.id ? 'active' : ''}" data-theme="${t.id}" role="button" tabindex="0">
                        <div class="ic">${t.ic}</div>
                        <div class="nm">${t.nm}</div>
                        <div class="ds">${t.ds}</div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    _renderAiDefaultsPanel(defaultBudget) {
        return `
        <div class="sv2-section">
            <h2>🤖 IA · provider per defecte</h2>
            <p>Quin provider s'utilitza per defecte a totes les crides IA · canvis aplicats immediatament. Cada crida es registra al ledger SOS (vinculat al projecte o a tu) via <code>iaContextAuditor</code>.</p>
            <div class="sv2-row" style="flex-direction:column;align-items:stretch;gap:6px;">
                <span class="sv2-label">Provider default</span>
                <select class="sv2-input" id="sv2DefaultProvider">
                    <option value="anthropic">🟣 Anthropic · claude-sonnet-4-6 (Netlify proxy · recomanat)</option>
                    <option value="openai">🟢 OpenAI · GPT-4o (direct API · cal API key)</option>
                    <option value="deepseek">🔵 DeepSeek · V3 (direct · code optimized · low cost)</option>
                    <option value="gemini">🟡 Gemini · 2.0 Flash (direct · fast multimodal)</option>
                    <option value="minimax">🩷 MiniMax · Text-01 (direct · 200K ctx · low cost)</option>
                    <option value="custom">⚙️ Local / Ollama (localhost:11434)</option>
                </select>
                <div style="display:flex;gap:6px;align-items:center;">
                    <button class="sv2-btn sv2-btn-primary" data-action="save-provider">💾 Guardar provider</button>
                    <span id="sv2ProviderStatus" class="sv2-status"></span>
                </div>
                <div style="font-size:0.72rem;color:var(--text-muted);">⚠ Si tries un provider sense API key configurada al tab "🔑 API keys" · les crides petaran. Anthropic via Netlify proxy és l'únic que no necessita key.</div>
            </div>
        </div>

        <div class="sv2-section">
            <h2>💸 Budget + tier</h2>
            <p>Configuració global del meta-orquestrador IA. Aplicable a projectes nous · els existents poden tenir override per projecte.</p>

            <div class="sv2-row">
                <span class="sv2-label">Budget mensual default</span>
                <input class="sv2-input" type="number" id="sv2DefaultBudget" min="0" step="0.5" value="${defaultBudget}">
                <span style="font-size:0.78rem;color:var(--text-secondary);">€ / projecte / mes</span>
                <button class="sv2-btn sv2-btn-primary" data-action="save-budget">💾 Save</button>
            </div>

            <div class="sv2-row">
                <span class="sv2-label">Tier per defecte</span>
                <select class="sv2-input" id="sv2DefaultTier">
                    <option value="draft">✏️ Draft · cheap (gpt-4o-mini · haiku) · ~0.002€/call</option>
                    <option value="quality" selected>⚡ Quality · balanced (gpt-4o · sonnet) · ~0.025€/call</option>
                    <option value="critical">🏆 Critical · top (opus · gpt-5) · ~0.15€/call</option>
                </select>
            </div>

            <p style="margin-top:0.8rem;font-size:0.75rem;">
                💡 Llegir més sobre el sistema cost-QA · <a href="/design" data-link class="sv2-deeplink">Design system</a> ·
                <a href="/efficiency" data-link class="sv2-deeplink">Efficiency dashboard</a> · veure auditoria · <code>iaContextAuditor.getStats()</code> (vista pública a /audit-ia · WO pendent)
            </p>
        </div>`;
    }

    _renderPermawebPanel() {
        return `
        <div class="sv2-section">
            <h2>🌐 Permaweb (Arweave)</h2>
            <p>Per publicar el teu perfil · projectes · ofertes al registre públic permaweb cal una wallet Arweave amb saldo Turbo Credits.</p>

            <div class="sv2-row">
                <span class="sv2-label">Wander/ArConnect</span>
                <button class="sv2-btn" data-action="permaweb-connect">🔌 Connecta extensió Wander</button>
            </div>
            <div class="sv2-row">
                <span class="sv2-label">Mode test (mock)</span>
                <label style="display:flex;gap:6px;align-items:center;font-size:0.82rem;cursor:pointer;">
                    <input type="checkbox" id="sv2PermawebMock" style="width:16px;height:16px;cursor:pointer;">
                    No publica realment · per a testing UX
                </label>
            </div>

            <p style="margin-top:0.8rem;font-size:0.75rem;">
                💡 Per a configuració completa (keyfile JSON · saldo Turbo) · <a href="/settings" data-link class="sv2-deeplink">Settings clàssic</a>
            </p>
        </div>`;
    }

    // ── Pagaments · Stripe + Plan · migrat de SettingsView V1 ──────────────
    _renderPaymentsPanel(stripeCfg, currentPlan) {
        const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        return `
        <div class="sv2-section">
            <h2>💳 Pla SOS</h2>
            <p>Trieu el pla actiu · controla quotes IA · saldo · features. Migració completa de Stripe Payment Links · zero claus secret al codi.</p>
            <div class="sv2-row" style="flex-direction:column;align-items:stretch;gap:8px;">
                <label class="sv2-label">Pla actual</label>
                <select id="sv2Plan" class="sv2-input">
                    ${VALID_PLAN_IDS.map(p => {
                        const pl = SOS_PLANS[p];
                        const label = pl.label + (pl.priceEurMonth !== null ? ' · ' + pl.priceEurMonth + ' €/mes' : ' · custom');
                        return `<option value="${esc(p)}" ${p === currentPlan.planId ? 'selected' : ''}>${esc(label)}</option>`;
                    }).join('')}
                </select>
                <button class="sv2-btn" data-action="save-plan">💾 Guardar pla</button>
                <div id="sv2PlanStatus" class="sv2-status"></div>
            </div>
        </div>

        <div class="sv2-section">
            <h2>🪪 Stripe Publishable Key (OPCIONAL)</h2>
            <p>Només la clau pública (<code>pk_test_</code> o <code>pk_live_</code>) · NO acceptem <code>sk_</code> ni <code>rk_</code>. Si tens claus secrètes exposades · revoca-les a <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noopener noreferrer" class="sv2-deeplink">dashboard.stripe.com</a>.</p>
            <div class="sv2-row" style="flex-direction:column;align-items:stretch;gap:6px;">
                <input type="text" id="sv2StripePk" class="sv2-input" value="${esc(stripeCfg.publishableKey || '')}" placeholder="pk_test_... · NOMÉS pk_ accepted">
                <div id="sv2StripePkStatus" class="sv2-status"></div>
            </div>
        </div>

        <div class="sv2-section">
            <h2>🔗 Payment Links · top-up wallet</h2>
            <p>Crea un Payment Link per cada amount al Stripe Dashboard · enganxa'l aquí. Cap clau secreta · només URL.</p>
            <div class="sv2-row" style="flex-direction:column;align-items:stretch;gap:8px;">
                ${DEFAULT_TOPUP_AMOUNTS.map(amount => {
                    const cur = stripeCfg.paymentLinks?.[String(amount)] || '';
                    return `
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-weight:700;min-width:50px;">${amount} €</span>
                        <input type="url" id="sv2StripeLink${amount}" class="sv2-input" style="flex:1;" value="${esc(cur)}" placeholder="https://buy.stripe.com/test_...">
                        ${cur ? `<button class="sv2-btn" data-action="open-topup" data-amount="${amount}">↗ Test</button>` : ''}
                    </div>`;
                }).join('')}
                <button class="sv2-btn sv2-btn-primary" data-action="save-stripe">💾 Guardar config Stripe</button>
                <div id="sv2StripeStatus" class="sv2-status"></div>
            </div>
        </div>`;
    }

    // ── Manifesto editor · migrat de SettingsView V1 ───────────────────────
    _renderManifestoPanel(manifesto) {
        const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const isDef = manifesto.isDefault !== false;
        return `
        <div class="sv2-section">
            <h2>📜 Manifesto del projecte</h2>
            <p>Text manifesto · embedded a cada export · serveix per documentar la teva visió cooperativa SOS. Per defecte SOS V11 · pots editar-lo.</p>
            <div class="sv2-row" style="flex-direction:column;align-items:stretch;gap:8px;">
                <div style="display:flex;gap:8px;align-items:center;">
                    <span class="sv2-label" style="margin:0;">Estat</span>
                    <span style="padding:2px 8px;border-radius:999px;background:${isDef ? 'rgba(148,163,184,0.18)' : 'rgba(34,197,94,0.18)'};color:${isDef ? '#94a3b8' : '#22c55e'};font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">${isDef ? 'Default' : 'Personalitzat'}</span>
                </div>
                <textarea id="sv2Manifesto" class="sv2-input" rows="14" style="font-family:var(--font-mono);font-size:0.78rem;line-height:1.55;">${esc(manifesto.text || SOS_MANIFESTO)}</textarea>
                <div class="sv2-row" style="gap:6px;">
                    <button class="sv2-btn sv2-btn-primary" data-action="save-manifesto">💾 Guardar</button>
                    <button class="sv2-btn" data-action="restore-manifesto">↺ Restaurar default</button>
                </div>
                <div id="sv2ManifestoStatus" class="sv2-status"></div>
            </div>
        </div>`;
    }

    _renderBackupPanel() {
        return `
        <div class="sv2-section">
            <h2>💾 Backup · Export / Import</h2>
            <p>El teu KB és <strong>local-first</strong>. Es desa al IndexedDB del navegador. Per portabilitat o copia de seguretat · exporta un snapshot firmat ECDSA P-256.</p>

            <div class="sv2-row">
                <button class="sv2-btn sv2-btn-primary" data-action="export-snapshot">📤 Exporta snapshot firmat</button>
                <button class="sv2-btn" data-action="import-snapshot">📥 Importa snapshot</button>
                <input type="file" id="sv2ImportFile" accept=".json,application/json" style="display:none;">
            </div>
            <div id="sv2BackupStatus" class="sv2-status" style="margin-top:8px;"></div>
        </div>
        <div class="sv2-section" style="border-color:rgba(239,68,68,0.25);">
            <h2 style="color:#ef4444;">⚠ Zona perillosa</h2>
            <p>Esborra totes les dades local-first del navegador. Acció irreversible · només si has fet backup primer.</p>
            <div class="sv2-row">
                <button class="sv2-btn sv2-btn-danger" data-action="reset-all">🗑 Esborra tot · Reset complet</button>
            </div>
        </div>`;
    }

    // ── Bind ──────────────────────────────────────────────────────────────

    _bindTabs() {
        document.querySelectorAll('.sv2-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                if (!tabId) return;
                document.querySelectorAll('.sv2-tab').forEach(b => b.classList.toggle('active', b === btn));
                document.querySelectorAll('.sv2-panel').forEach(p => {
                    p.classList.toggle('active', p.dataset.panel === tabId);
                });
                this._activeTab = tabId;
            });
        });
    }

    _bindActions() {
        // API keys · save/clear (placeholder · KB.upsert el caller real ho farà)
        document.querySelectorAll('[data-apikey-save]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.apikeySave;
                const input = document.querySelector('[data-apikey="' + id + '"]');
                const value = (input?.value || '').trim();
                if (!value) {
                    toast({ kind: 'warn', text: 'Cap valor introduït per a ' + id });
                    return;
                }
                try {
                    await this._saveApiKey(id, value);
                    toast({ kind: 'success', text: 'API key ' + id + ' desada · refresca per veure mascara' });
                } catch (e) {
                    toast({ kind: 'error', text: 'Error desant: ' + (e?.message || e) });
                }
            });
        });
        document.querySelectorAll('[data-apikey-clear]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.apikeyClear;
                const { confirm } = await import('../core/uxComponents.js');
                const ok = await confirm({
                    title: 'Esborrar API key',
                    body: 'Estàs segur de voler esborrar la clau de ' + id + '? Caldrà reintroduir-la per a fer crides IA.',
                    confirmLabel: 'Sí · esborra',
                    danger: true,
                });
                if (!ok) return;
                try {
                    await this._clearApiKey(id);
                    toast({ kind: 'success', text: 'API key ' + id + ' esborrada' });
                    // Refresh tab
                    setTimeout(() => this.render(), 600);
                } catch (e) {
                    toast({ kind: 'error', text: 'Error esborrant: ' + (e?.message || e) });
                }
            });
        });

        // Theme
        document.querySelectorAll('[data-theme]').forEach(card => {
            card.addEventListener('click', async () => {
                const themeId = card.dataset.theme;
                if (!themeId) return;
                try {
                    await saveTheme(KB, themeId);
                    applyThemeToDocument(themeId);
                    document.querySelectorAll('[data-theme]').forEach(c => c.classList.toggle('active', c === card));
                    toast({ kind: 'success', text: 'Tema canviat a ' + themeId });
                } catch (e) {
                    toast({ kind: 'error', text: 'Error canviant tema: ' + (e?.message || e) });
                }
            });
        });

        // AI defaults · save budget
        document.querySelector('[data-action="save-budget"]')?.addEventListener('click', () => {
            const v = parseFloat(document.getElementById('sv2DefaultBudget')?.value || '0');
            if (!isFinite(v) || v < 0) {
                toast({ kind: 'error', text: 'Budget invàlid · ha de ser ≥ 0' });
                return;
            }
            try {
                setBudget('default-global', v);
                toast({ kind: 'success', text: 'Budget global desat · ' + v + '€/mes' });
            } catch (e) {
                toast({ kind: 'error', text: 'Error: ' + (e?.message || e) });
            }
        });

        // Save default provider · resol feedback usuari "poder escoger api por defecto"
        document.querySelector('[data-action="save-provider"]')?.addEventListener('click', async () => {
            const sel = document.getElementById('sv2DefaultProvider');
            const provider = sel?.value;
            const statusEl = document.getElementById('sv2ProviderStatus');
            const setStatus = (msg, ok = true) => { if (!statusEl) return; statusEl.textContent = msg; statusEl.style.color = ok ? 'var(--accent-green)' : 'var(--accent-red)'; };
            if (!provider) {
                setStatus('✗ Tria un provider', false);
                return;
            }
            try {
                const { Orchestrator } = await import('../core/Orchestrator.js');
                await Orchestrator.setDefaultProvider(provider);
                setStatus('✓ Provider actiu · ' + provider, true);
                toast({ kind: 'success', text: 'Default IA provider · ' + provider });
            } catch (e) {
                setStatus('✗ Error · ' + (e?.message || e), false);
            }
        });

        // Reset all · perillós · confirm modal
        document.querySelector('[data-action="reset-all"]')?.addEventListener('click', async () => {
            const { confirm } = await import('../core/uxComponents.js');
            const ok = await confirm({
                title: 'Reset complet · perillós',
                body: 'Això esborrarà TOTES les dades del navegador (projectes · KB · wallet · API keys). Acció IRREVERSIBLE. Has fet backup?',
                confirmLabel: 'Sí · esborra tot',
                cancelLabel: 'No · cancel',
                danger: true,
            });
            if (!ok) return;
            try {
                if (typeof indexedDB !== 'undefined') {
                    const req = indexedDB.deleteDatabase('TeamTowers_V11');
                    req.onsuccess = () => {
                        localStorage.clear();
                        toast({ kind: 'success', text: 'Reset complet · recarregant en 2s...' });
                        setTimeout(() => window.location.href = '/home', 2000);
                    };
                }
            } catch (e) {
                toast({ kind: 'error', text: 'Error: ' + (e?.message || e) });
            }
        });

        // ── Export/import · migrat de V1 · ja no redirigeix a /settings ────
        const backupStatus = (msg, kind = 'ok') => {
            const el = document.getElementById('sv2BackupStatus');
            if (!el) return;
            el.textContent = msg;
            el.style.color = kind === 'ok' ? 'var(--accent-green)' : kind === 'warn' ? 'var(--accent-orange)' : 'var(--accent-red)';
        };
        document.querySelector('[data-action="export-snapshot"]')?.addEventListener('click', async () => {
            try {
                backupStatus('⏳ Generant snapshot...', 'warn');
                await downloadSnapshotJson();
                backupStatus('✓ Snapshot descarregat', 'ok');
            } catch (e) {
                backupStatus('✗ Error · ' + (e?.message || e), 'err');
                toast({ kind: 'error', text: 'Error exportant: ' + (e?.message || e) });
            }
        });
        document.querySelector('[data-action="import-snapshot"]')?.addEventListener('click', () => {
            document.getElementById('sv2ImportFile')?.click();
        });
        document.getElementById('sv2ImportFile')?.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
                backupStatus('⏳ Llegint fitxer...', 'warn');
                const snap = await readSnapshotFromFile(file);
                const result = await importSnapshot(snap, { mode: 'merge' });
                backupStatus('✓ Snapshot importat · ' + (result?.imported || 0) + ' nodes', 'ok');
                toast({ kind: 'success', text: 'Snapshot importat · refresca per veure dades' });
                e.target.value = '';
            } catch (err) {
                backupStatus('✗ Error · ' + (err?.message || err), 'err');
                toast({ kind: 'error', text: 'Error important: ' + (err?.message || err) });
                e.target.value = '';
            }
        });

        // ── Plan · migrat de V1 ─────────────────────────────────────────────
        document.querySelector('[data-action="save-plan"]')?.addEventListener('click', async () => {
            const sel = document.getElementById('sv2Plan');
            const planId = sel?.value;
            const statusEl = document.getElementById('sv2PlanStatus');
            const setStatus = (msg, ok = true) => { if (!statusEl) return; statusEl.textContent = msg; statusEl.style.color = ok ? 'var(--accent-green)' : 'var(--accent-red)'; };
            if (!planId || !VALID_PLAN_IDS.includes(planId)) {
                setStatus('✗ Pla invàlid', false);
                return;
            }
            try {
                await setCurrentPlan(KB, planId);
                setStatus('✓ Pla actiu · ' + SOS_PLANS[planId].label, true);
                toast({ kind: 'success', text: 'Pla canviat a ' + SOS_PLANS[planId].label });
            } catch (e) {
                setStatus('✗ Error · ' + (e?.message || e), false);
            }
        });

        // ── Stripe · migrat de V1 ───────────────────────────────────────────
        const pkInput = document.getElementById('sv2StripePk');
        const pkStatus = document.getElementById('sv2StripePkStatus');
        const setPkStatus = (msg, ok = true) => { if (!pkStatus) return; pkStatus.textContent = msg; pkStatus.style.color = ok ? 'var(--accent-green)' : 'var(--accent-red)'; };
        pkInput?.addEventListener('input', () => {
            const v = (pkInput.value || '').trim();
            if (!v) { setPkStatus(''); return; }
            const type = detectKeyType(v);
            if (type === 'sk' || type === 'rk') {
                setPkStatus('⚠ ' + type.toUpperCase() + ' KEY · NO USIS AQUÍ · revoca-la i fes "Roll key" al dashboard Stripe', false);
            } else if (validatePublishableKey(v)) {
                setPkStatus('✓ Format pk_* vàlid', true);
            } else {
                setPkStatus('✗ Format invàlid · ha de començar amb pk_test_ o pk_live_', false);
            }
        });
        document.querySelector('[data-action="save-stripe"]')?.addEventListener('click', async () => {
            const statusEl = document.getElementById('sv2StripeStatus');
            const setStatus = (msg, ok = true) => { if (!statusEl) return; statusEl.textContent = msg; statusEl.style.color = ok ? 'var(--accent-green)' : 'var(--accent-red)'; };
            const pk = (pkInput?.value || '').trim();
            if (pk && !validatePublishableKey(pk)) {
                setStatus('✗ Stripe pk_ invàlida · no s\'ha desat', false);
                return;
            }
            const links = {};
            for (const amount of DEFAULT_TOPUP_AMOUNTS) {
                const v = document.getElementById('sv2StripeLink' + amount)?.value?.trim() || '';
                if (v && !validatePaymentLinkUrl(v)) {
                    setStatus('✗ Payment Link per a ' + amount + '€ invàlid · ha de ser https://buy.stripe.com/...', false);
                    return;
                }
                if (v) links[String(amount)] = v;
            }
            try {
                await saveStripeConfig(KB, { publishableKey: pk, paymentLinks: links });
                setStatus('✓ Config Stripe desada · ' + Object.keys(links).length + ' Payment Links actius', true);
                toast({ kind: 'success', text: 'Stripe config desada' });
            } catch (e) {
                setStatus('✗ Error · ' + (e?.message || e), false);
            }
        });
        document.querySelectorAll('[data-action="open-topup"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const amount = parseInt(btn.dataset.amount, 10);
                if (!Number.isFinite(amount)) return;
                try { await openTopupPaymentLink(KB, amount); } catch (e) {
                    toast({ kind: 'error', text: 'Error obrint link · ' + (e?.message || e) });
                }
            });
        });

        // ── Manifesto · migrat de V1 ────────────────────────────────────────
        document.querySelector('[data-action="save-manifesto"]')?.addEventListener('click', async () => {
            const ta = document.getElementById('sv2Manifesto');
            const text = ta?.value || '';
            const statusEl = document.getElementById('sv2ManifestoStatus');
            const setStatus = (msg, ok = true) => { if (!statusEl) return; statusEl.textContent = msg; statusEl.style.color = ok ? 'var(--accent-green)' : 'var(--accent-red)'; };
            try {
                await saveManifesto(KB, { text });
                setStatus('✓ Manifesto desat · ' + text.length + ' caràcters', true);
                toast({ kind: 'success', text: 'Manifesto desat' });
            } catch (e) {
                setStatus('✗ Error · ' + (e?.message || e), false);
            }
        });
        document.querySelector('[data-action="restore-manifesto"]')?.addEventListener('click', async () => {
            const { confirm } = await import('../core/uxComponents.js');
            const ok = await confirm({
                title: 'Restaurar manifesto default',
                body: 'Substituirà el manifesto actual pel default de SOS V11. Continuar?',
                confirmLabel: 'Sí · restaurar',
                cancelLabel: 'No',
            });
            if (!ok) return;
            try {
                await restoreDefaultManifesto(KB);
                toast({ kind: 'success', text: 'Manifesto restaurat · recarregant...' });
                setTimeout(() => this.render(), 600);
            } catch (e) {
                toast({ kind: 'error', text: 'Error · ' + (e?.message || e) });
            }
        });
    }

    // ── Data helpers ──────────────────────────────────────────────────────

    async _loadApiKeys() {
        // Best-effort · només mostra mascara · no exposa les claus al DOM
        try {
            const nodes = await KB.query({ type: 'api_key' });
            const map = {};
            for (const n of (nodes || [])) {
                const provider = n.content?.provider || n.id?.split('-')[1];
                if (provider) map[provider] = n.content?.key || n.content?.mask || '';
            }
            return map;
        } catch (_) { return {}; }
    }

    async _saveApiKey(provider, key) {
        const node = {
            id: 'api-key-' + provider,
            type: 'api_key',
            content: { provider, key, savedAt: Date.now() },
            keywords: ['type:api_key', 'provider:' + provider],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        await KB.upsert(node);
    }

    async _clearApiKey(provider) {
        try { await KB.delete('api-key-' + provider); } catch (_) {}
    }

    destroy() {}
}

export const TPL_VERSION = 'settings-v2-v1.0';
