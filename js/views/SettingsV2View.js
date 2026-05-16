// =============================================================================
// TEAMTOWERS SOS V11 — SETTINGS V2 (UX-C · sprint settings unificades)
// Ruta · /js/views/SettingsV2View.js  →  /settings-v2
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

export default class SettingsV2View {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'Settings v2 · SOS';
        this._activeTab = 'api-keys';
    }

    async getHtml() {
        const currentTheme = await loadCurrentTheme(KB).catch(() => 'dark');
        const apiKeys = await this._loadApiKeys();
        const defaultBudget = getBudget('default-global') || 5.0;

        this._state = { currentTheme, apiKeys, defaultBudget };
        return this._renderShell({ currentTheme, apiKeys, defaultBudget });
    }

    async afterRender() {
        this._bindTabs();
        this._bindActions();
    }

    async render() {
        const app = (typeof document !== 'undefined') ? document.getElementById('app') : null;
        if (!app) return;
        app.innerHTML = await this.getHtml();
        await this.afterRender();
    }

    _renderShell({ currentTheme, apiKeys, defaultBudget }) {
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
                ${renderCanonicalBadge({ label: 'V2 · oficial', title: 'Versió oficial · 5 tabs · KISS · l\'antiga /settings serà eliminada pre-alfa.' })}
                <span style="flex:1;"></span>
                <a href="/settings" data-link class="sv2-back" title="Settings clàssic · opcions avançades pendents de migrar">↩ Legacy (pendent de migrar)</a>
            </div>

            <div class="sv2-main">
                <div class="sv2-tabs" role="tablist">
                    <button class="sv2-tab active" data-tab="api-keys" role="tab">🔑 API keys</button>
                    <button class="sv2-tab" data-tab="theme" role="tab">🎨 Tema</button>
                    <button class="sv2-tab" data-tab="ai-defaults" role="tab">🤖 IA</button>
                    <button class="sv2-tab" data-tab="permaweb" role="tab">🌐 Permaweb</button>
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
                <div class="sv2-panel" data-panel="permaweb">
                    ${this._renderPermawebPanel()}
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
            <h2>🤖 IA defaults</h2>
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
                <a href="/efficiency" data-link class="sv2-deeplink">Efficiency dashboard</a>
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

        // Export/import · delegate to existing settings flow
        document.querySelector('[data-action="export-snapshot"]')?.addEventListener('click', () => {
            window.location.href = '/settings#export';
        });
        document.querySelector('[data-action="import-snapshot"]')?.addEventListener('click', () => {
            window.location.href = '/settings#import';
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
