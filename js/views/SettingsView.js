// TEAMTOWERS SOS V11 — SETTINGS VIEW
import { store }                from '../core/store.js';
import { KB }                   from '../core/kb.js';
import { Orchestrator }         from '../core/Orchestrator.js';
import { t, langSelectorHtml }  from '../i18n.js';
import { renderNavLinksHtml, renderNavGroupedHtml, ensureNavGroupStyle, bindNavGroupDropdowns } from '../core/navService.js';
import { loadManifesto, saveManifesto, restoreDefaultManifesto, isDefaultManifesto, SOS_MANIFESTO } from '../core/sosManifesto.js';
import { SOS_PLANS, VALID_PLAN_IDS, DEFAULT_TOPUP_AMOUNTS, validatePublishableKey, detectKeyType, validatePaymentLinkUrl, loadStripeConfig, saveStripeConfig, loadCurrentPlan, setCurrentPlan, openTopupPaymentLink } from '../core/stripeService.js';
import { loadCurrentTheme, saveTheme, applyThemeToDocument } from '../core/themeService.js';

function escapeForTextarea(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default class SettingsView {
    constructor() { document.title = 'Settings · SOS V11'; }

    async getHtml() {
        await store.init();
        await KB.init();
        const stripeCfg  = await loadStripeConfig(KB);
        const currentPlan = await loadCurrentPlan(KB) || { planId: 'free', walletBalanceEur: 0 };
        const currentTheme = await loadCurrentTheme(KB);
        const provider = await Orchestrator.getDefaultProvider();
        const keyAnt   = await Orchestrator.getApiKey('anthropic') || '';
        const keyOai   = await Orchestrator.getApiKey('openai')    || '';
        const keyDs    = await Orchestrator.getApiKey('deepseek')  || '';
        const keyGem   = await Orchestrator.getApiKey('gemini')    || '';
        const keyMm    = await Orchestrator.getApiKey('minimax')   || '';
        const pruningOn  = await Orchestrator.isContextPruningEnabled();
        const chargingOn = await Orchestrator.isWalletChargingEnabled();
        const manifesto  = await loadManifesto(KB);
        const manifestoText  = manifesto.text;
        const manifestoIsDef = manifesto.isDefault;
        const manifestoExists = manifesto.exists;

        const pColors  = { anthropic:'var(--accent-purple)', openai:'var(--accent-green)', deepseek:'var(--accent-blue)', gemini:'#fbbc04', minimax:'#ff6b9d', custom:'var(--text-muted)' };
        const pLabels  = { anthropic:'Anthropic · claude-sonnet-4-20250514', openai:'OpenAI · GPT-4o', deepseek:'DeepSeek · V3', gemini:'Gemini · 2.0 Flash', minimax:'MiniMax · Text-01', custom:'Local / Ollama' };
        const pHints   = { anthropic:'primary · via Netlify proxy', openai:'direct API', deepseek:'direct API · code optimized', gemini:'direct API · fast multimodal', minimax:'direct API · 200K ctx · low cost', custom:'localhost:11434' };
        const pColor   = pColors[provider]  || pColors.anthropic;
        const pLabel   = pLabels[provider]  || pLabels.anthropic;
        const pHint    = pHints[provider]   || '';

        function keyBadge(k) {
            if (k) return 'background:rgba(0,230,118,0.12);color:var(--accent-green)';
            return 'background:rgba(255,255,255,0.05);color:var(--text-muted)';
        }
        function keyText(k) { return k ? '✓ SET' : '— EMPTY'; }

        return `
        <style>
            .sv-wrap { max-width:720px; margin:0 auto; padding:var(--space-8) var(--space-6); animation:fadeIn 0.3s var(--ease-out); }
            .sv-wrap h1 { font-size:var(--text-2xl); font-weight:800; margin-bottom:var(--space-2); color:var(--text-main); letter-spacing:-0.02em; }
            .sv-wrap h1 span { color:var(--accent-purple); }
            .sv-card {
                background: var(--bg-panel);
                border: 1px solid var(--border-default);
                border-radius: var(--radius-lg);
                padding: var(--space-6);
                margin-bottom: var(--space-5);
                box-shadow: var(--shadow-sm);
                color: var(--text-main);
            }
            .sv-card h3 { font-size:var(--text-md); font-weight:700; margin:0 0 var(--space-3) 0; letter-spacing:-0.01em; }
            .sv-card p  { color:var(--text-secondary); font-size:var(--text-sm); line-height:var(--leading-normal); }
            .sv-label { display:block; font-size:var(--text-xs); color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em; font-weight:600; margin-bottom:var(--space-2); }
            .sv-input {
                width:100%;
                background:var(--bg-elevated);
                border:1px solid var(--border-default);
                color:var(--text-main);
                padding:10px 12px;
                border-radius:var(--radius-md);
                font-family:var(--font-mono);
                font-size:var(--text-sm);
                outline:none;
                transition:border-color var(--dur-fast), box-shadow var(--dur-fast);
                box-sizing:border-box;
            }
            .sv-input:focus { border-color:var(--accent-indigo); box-shadow:var(--shadow-focus); }
            .sv-select { font-family:var(--font-base); font-weight:600; }
            .sv-btn {
                background:linear-gradient(135deg,var(--accent-indigo),var(--accent-purple));
                color:#fff;
                border:none;
                padding:10px 18px;
                border-radius:var(--radius-md);
                font-weight:700;
                cursor:pointer;
                transition:filter var(--dur-fast), transform var(--dur-fast);
                margin-top:var(--space-3);
                font-size:var(--text-sm);
                font-family:var(--font-base);
                letter-spacing:-0.005em;
            }
            .sv-btn:hover { filter:brightness(1.08); transform:translateY(-1px); }
            .sv-btn-test {
                background:transparent;
                border:1px solid var(--border-default);
                color:var(--text-secondary);
                padding:10px 16px;
                border-radius:var(--radius-md);
                font-weight:600;
                cursor:pointer;
                transition:all var(--dur-fast);
                margin-top:var(--space-3);
                margin-left:8px;
                font-size:var(--text-sm);
                font-family:var(--font-base);
            }
            .sv-btn-test:hover { border-color:var(--accent-green); color:var(--accent-green); }
            .sv-status { display:none; margin-top:var(--space-3); font-size:var(--text-xs); color:var(--accent-green); font-family:var(--font-mono); }
            .sv-back { display:inline-flex; align-items:center; gap:var(--space-2); color:var(--text-secondary); text-decoration:none; font-size:var(--text-sm); font-weight:600; margin-bottom:var(--space-5); transition:color var(--dur-fast); }
            .sv-back:hover { color:var(--text-main); }
            .sv-active-badge { display:inline-flex; align-items:center; gap:7px; font-size:var(--text-xs); font-family:var(--font-mono); padding:5px 12px; border-radius:var(--radius-sm); font-weight:600; margin-bottom:var(--space-5); }
            .sv-key-row { display:grid; grid-template-columns:1fr auto; gap:8px; align-items:center; margin-bottom:12px; }
            .sv-key-status { font-size:11px; font-family:var(--font-mono); padding:3px 8px; border-radius:4px; font-weight:600; white-space:nowrap; }
            .sv-test-result { margin-top:10px; font-size:var(--text-xs); font-family:var(--font-mono); min-height:16px; }
        </style>

        <div class="sv-wrap">
            <div style="display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;margin-bottom:var(--space-4);">
                <a href="/" data-link class="sv-back" style="margin-bottom:0;">← Home</a>
                <span style="color:var(--text-muted);">·</span>
                
            </div>
            <h1 class="mat-hero-h1">Settings <strong>·</strong> Vault</h1>
            <p style="color:var(--text-muted);margin-bottom:var(--space-8);">API Keys · AI Engine · IndexedDB (zero localStorage)</p>

            <div class="sv-card" style="border-top:3px solid ${pColor};">

                <div class="sv-active-badge" style="background:${pColor}18;color:${pColor};border:1px solid ${pColor}40;">
                    <span style="width:7px;height:7px;border-radius:50%;background:${pColor};flex-shrink:0;animation:pulse 2s infinite;"></span>
                    ACTIVE: ${pLabel}
                    <span style="opacity:.6;font-weight:400;font-size:9px;">${pHint}</span>
                </div>

                <div style="margin-bottom:var(--space-6);">
                    <label class="sv-label">Primary engine</label>
                    <select id="svProvider" class="sv-input sv-select" style="color:${pColor};">
                        <option value="anthropic" ${provider==='anthropic'?'selected':''}>✦ Anthropic (claude-sonnet-4-20250514)</option>
                        <option value="openai"    ${provider==='openai'   ?'selected':''}>◆ OpenAI (GPT-4o)</option>
                        <option value="deepseek"  ${provider==='deepseek' ?'selected':''}>◈ DeepSeek (V3)</option>
                        <option value="gemini"    ${provider==='gemini'   ?'selected':''}>◉ Google Gemini 2.0 Flash</option>
                        <option value="minimax"   ${provider==='minimax'  ?'selected':''}>◐ MiniMax Text-01 (200K · low cost)</option>
                        <option value="custom"    ${provider==='custom'   ?'selected':''}>◎ Local / Ollama</option>
                    </select>
                </div>

                <label class="sv-label">Anthropic API Key <span style="color:var(--accent-green);font-size:9px;">(primary · via Netlify proxy)</span></label>
                <div class="sv-key-row">
                    <input type="password" id="svKeyAnt" class="sv-input" value="${keyAnt}" placeholder="sk-ant-api03-...">
                    <span class="sv-key-status" style="${keyBadge(keyAnt)}">${keyText(keyAnt)}</span>
                </div>

                <label class="sv-label">OpenAI API Key</label>
                <div class="sv-key-row">
                    <input type="password" id="svKeyOai" class="sv-input" value="${keyOai}" placeholder="sk-proj-...">
                    <span class="sv-key-status" style="${keyBadge(keyOai)}">${keyText(keyOai)}</span>
                </div>

                <label class="sv-label">DeepSeek API Key</label>
                <div class="sv-key-row">
                    <input type="password" id="svKeyDs" class="sv-input" value="${keyDs}" placeholder="sk-...">
                    <span class="sv-key-status" style="${keyBadge(keyDs)}">${keyText(keyDs)}</span>
                </div>

                <label class="sv-label">Google Gemini API Key</label>
                <div class="sv-key-row">
                    <input type="password" id="svKeyGem" class="sv-input" value="${keyGem}" placeholder="AIza...">
                    <span class="sv-key-status" style="${keyBadge(keyGem)}">${keyText(keyGem)}</span>
                </div>

                <label class="sv-label">MiniMax API Key <span style="color:#ff6b9d;font-size:9px;">(platform.minimax.io · 200K ctx)</span></label>
                <div class="sv-key-row">
                    <input type="password" id="svKeyMm" class="sv-input" value="${keyMm}" placeholder="eyJhbGc...">
                    <span class="sv-key-status" style="${keyBadge(keyMm)}">${keyText(keyMm)}</span>
                </div>

                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <button id="svSave" class="sv-btn">💾 Save to KB</button>
                    <button id="svTest" class="sv-btn-test">⚡ Test connection</button>
                </div>
                <div id="svTestResult" class="sv-test-result"></div>
                <div id="svStatus" class="sv-status">✅ Saved in IndexedDB</div>
            </div>

            <div class="sv-card" style="border-top:3px solid #06b6d4;">
                <h3 style="color:#06b6d4;margin-top:0;">🧠 KM-001 · Context pruning (sprint E)</h3>
                <p style="color:var(--text-muted);font-size:var(--text-xs);line-height:1.5;margin-top:0;">
                    Reduce los tokens enviados al LLM seleccionando sólo los nodos del KB con
                    mayor relevancia para la task (tagOverlap + recency + typeBoost + priority).
                    Default <strong>off</strong> · sprint E2 lo enganchará automáticamente
                    a sectorCloner / roleSopGenerator / woAssistant cuando esté activado.
                </p>
                <label style="display:flex;align-items:center;gap:0.6rem;cursor:pointer;font-size:var(--text-sm);margin-top:var(--space-3);">
                    <input type="checkbox" id="svPruningToggle" ${pruningOn ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;">
                    <span>Activar context pruning global</span>
                    <span id="svPruningStatus" class="sv-key-status" style="${pruningOn ? 'background:rgba(0,230,118,0.12);color:var(--accent-green);' : 'background:rgba(255,255,255,0.05);color:var(--text-muted);'}">${pruningOn ? '✓ ON' : '— OFF'}</span>
                </label>
            </div>

            <div class="sv-card" style="border-top:3px solid #22c55e;">
                <h3 style="color:#22c55e;margin-top:0;">💶 MKT-001 · Cargo automático al wallet (sprint C3)</h3>
                <p style="color:var(--text-muted);font-size:var(--text-xs);line-height:1.5;margin-top:0;">
                    Cuando una llamada IA está vinculada a un proyecto (vía
                    <code>contextPruning</code>), descuenta automáticamente el coste real
                    (USD → EUR a 0.92) del <a href="/wallet" data-link class="sv-link" style="color:#22c55e;">wallet del proyecto</a>.
                    Si saldo insuficiente, se aplica con <code>allowNegative</code> y se
                    emite warning · NO bloquea el flujo IA. Cada cargo queda en el ledger
                    del wallet con kind <code>consume</code>.
                </p>
                <label style="display:flex;align-items:center;gap:0.6rem;cursor:pointer;font-size:var(--text-sm);margin-top:var(--space-3);">
                    <input type="checkbox" id="svChargingToggle" ${chargingOn ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;">
                    <span>Activar cargo automático al wallet</span>
                    <span id="svChargingStatus" class="sv-key-status" style="${chargingOn ? 'background:rgba(0,230,118,0.12);color:var(--accent-green);' : 'background:rgba(255,255,255,0.05);color:var(--text-muted);'}">${chargingOn ? '✓ ON' : '— OFF'}</span>
                </label>
            </div>

            <div class="sv-card" style="border-top:3px solid #c084fc;">
                <h3 style="color:var(--accent-purple);margin-top:0;">📜 MAT-002-G · Manifesto SOS canónico</h3>
                <p style="color:var(--text-muted);font-size:var(--text-xs);line-height:1.6;margin-top:0;">
                    Texto de referencia que recoge la <strong>visión + 4 pilares + principios</strong>
                    de SOS V11 · persistido como nodo KB
                    <code>${SOS_MANIFESTO.nodeType}</code>/<code>${SOS_MANIFESTO.nodeKind}</code>.
                    <br><strong style="color:var(--accent-purple);">NO se inyecta automáticamente</strong>
                    en <code>Orchestrator.callLLM</code> · preserva calidad/coste de tokens
                    (uno de los valores añadidos centrales de SOS). Es referencia consultable ·
                    no premisa inyectada. Sprint B futuro permitirá opt-in muy específico
                    en flujos donde el coste por token no es crítico.
                </p>
                <label class="sv-label" style="margin-top:var(--space-4);">Manifesto (editable)
                    <span class="sv-key-status" style="margin-left:8px;${manifestoIsDef ? 'background:rgba(192,132,252,0.12);color:var(--accent-purple);' : 'background:rgba(0,230,118,0.12);color:var(--accent-green);'}">${manifestoIsDef ? '◆ DEFAULT' : '✎ EDITED'}</span>
                    <span class="sv-key-status" style="margin-left:6px;${manifestoExists ? 'background:rgba(0,230,118,0.12);color:var(--accent-green);' : 'background:rgba(255,255,255,0.05);color:var(--text-muted);'}">${manifestoExists ? '✓ SAVED' : '— SEED'}</span>
                </label>
                <textarea id="svManifesto" rows="14" class="sv-input" style="font-family:var(--font-mono);font-size:var(--text-xs);line-height:1.5;resize:vertical;min-height:240px;">${escapeForTextarea(manifestoText)}</textarea>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:var(--space-3);">
                    <button id="svManifestoSave" class="sv-btn" style="background:linear-gradient(135deg,#c084fc,#9333ea);">💾 Guardar manifesto</button>
                    <button id="svManifestoRestore" class="sv-btn-test">↺ Restaurar default</button>
                </div>
                <div id="svManifestoStatus" class="sv-test-result"></div>
            </div>

            <div class="sv-card" style="border-top:3px solid #a855f7;">
                <h3 style="color:#a855f7;margin-top:0;">🧪 Mode test · Permaweb (mock)</h3>
                <p style="color:var(--text-muted);font-size:var(--text-xs);line-height:1.6;margin-top:0;">
                    PERM-USER-001 sprint E+ · activa el mode test perquè el botó <strong>🌐 Publicar</strong>
                    de <a href="/identity" data-link style="color:var(--accent-indigo);">/identity</a> generi un
                    <strong>txId fake</strong> (prefix <code>MOCK_TX_</code>) <strong>sense descomptar saldo del wallet ni pujar res al permaweb</strong>.
                    Útil per provar el flux end-to-end (signatura ECDSA · cache local · UI badges · revoke) sense cost real.
                    Persistit al KB com a config · revisable abans de cada publish.
                </p>
                <div style="display:flex;align-items:center;gap:10px;margin-top:14px;">
                    <label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;">
                        <input type="checkbox" id="svPermawebMock" style="width:18px;height:18px;cursor:pointer;">
                        <span style="font-weight:600;">Mode test ON</span>
                    </label>
                    <span id="svPermawebMockStatus" class="sv-key-status" style="font-size:11px;"></span>
                </div>
            </div>

            <div class="sv-card" style="border-top:3px solid #06b6d4;">
                <h3 style="color:#06b6d4;margin-top:0;">🌐 Idioma · llengua de la interfície</h3>
                <p style="color:var(--text-muted);font-size:var(--text-xs);line-height:1.6;margin-top:0;">
                    UX-AUDIT-001 sprint D · 3 idiomes suportats · default <strong>ES (Español)</strong>
                    · <strong>CA (Català)</strong> per la Matriu cohort 0 · <strong>EN</strong>
                    per a la xarxa ampliada. Persisteix al KB · al canviar es recarrega la vista activa.
                </p>
                <div id="settLangSel" style="margin-top:14px;"></div>
            </div>

            <div class="sv-card" style="border-top:3px solid #fbbf24;">
                <h3 style="color:#fbbf24;margin-top:0;">🎨 Aspecte · tema visual</h3>
                <p style="color:var(--text-muted);font-size:var(--text-xs);line-height:1.6;margin-top:0;">
                    SOS es pot veure en <strong>fosc</strong> (default · tècnic) o <strong>clar</strong>
                    (Matriu-friendly · més suau). El tema s'aplica globalment · les vistes
                    individuals (mapa · landing /matriu) mantenen el seu skin propi.
                </p>
                <div style="display:flex;gap:8px;margin-top:14px;">
                    <button class="sv-btn sv-theme-btn ${currentTheme === 'dark'  ? 'is-active' : ''}" data-theme="dark"  style="flex:1;background:${currentTheme === 'dark'  ? 'linear-gradient(135deg,#0a0a0f,#1a1a22)' : 'transparent'};color:${currentTheme === 'dark'  ? '#fff' : 'var(--text-muted)'};border:1px solid ${currentTheme === 'dark'  ? '#444' : 'var(--glass-border)'};">🌙 Fosc</button>
                    <button class="sv-btn sv-theme-btn ${currentTheme === 'light' ? 'is-active' : ''}" data-theme="light" style="flex:1;background:${currentTheme === 'light' ? 'linear-gradient(135deg,#f8f8fb,#ffffff)' : 'transparent'};color:${currentTheme === 'light' ? '#1a1a22' : 'var(--text-muted)'};border:1px solid ${currentTheme === 'light' ? '#aaa' : 'var(--glass-border)'};">☀️ Clar</button>
                </div>
            </div>

            <div class="sv-card" style="border-top:3px solid #635bff;">
                <h3 style="color:#635bff;margin-top:0;">💳 ALPHA-STRIPE-001 · Saldo prepagat + plans</h3>
                <p style="color:var(--text-muted);font-size:var(--text-xs);line-height:1.6;margin-top:0;">
                    Pla actual · <strong style="color:#635bff;">${escapeForTextarea(currentPlan.planId)}</strong>
                    · saldo wallet <strong>${currentPlan.walletBalanceEur.toFixed(2)} €</strong>.
                    SOS és local-first sense backend propi · per al cobrament usem
                    <strong>Stripe Payment Links</strong> (URLs creades manualment al
                    Stripe Dashboard) · zero claus secret/restricted al codi.
                </p>

                <div style="background:rgba(255,82,82,0.08);border:1px solid rgba(255,82,82,0.3);border-radius:6px;padding:10px 12px;margin:14px 0;font-size:var(--text-xs);color:var(--accent-red);">
                    ⚠️ <strong>SEGURETAT</strong> · MAI posis aquí <code>sk_test_</code>,
                    <code>sk_live_</code>, <code>rk_test_</code> o <code>rk_live_</code>
                    · només la clau pública (<code>pk_test_</code> / <code>pk_live_</code>)
                    pot anar al frontend. Si has compartit una clau secret/restricted
                    accidentalment · revoca-la a
                    <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noopener noreferrer" style="color:var(--accent-red);">dashboard.stripe.com/test/apikeys</a>.
                </div>

                <label class="sv-label">Plan SOS V11</label>
                <select id="svPlan" class="sv-input sv-select" style="margin-bottom:14px;">
                    ${VALID_PLAN_IDS.map(p => `<option value="${p}" ${p === currentPlan.planId ? 'selected' : ''}>${escapeForTextarea(SOS_PLANS[p].label)} ${SOS_PLANS[p].priceEurMonth !== null ? '· ' + SOS_PLANS[p].priceEurMonth + ' €/mes' : '· custom'}</option>`).join('')}
                </select>

                <label class="sv-label">Stripe Publishable Key (pk_test_ / pk_live_) · OPCIONAL</label>
                <input type="text" id="svStripePk" class="sv-input" value="${escapeForTextarea(stripeCfg.publishableKey || '')}" placeholder="pk_test_... · NOMÉS pk_ accepted">
                <div id="svStripePkStatus" class="sv-test-result"></div>

                <label class="sv-label" style="margin-top:14px;">Payment Links (Stripe Dashboard → Payment Links → crea un per cada amount)</label>
                ${DEFAULT_TOPUP_AMOUNTS.map(amount => {
                    const cur = stripeCfg.paymentLinks?.[String(amount)] || '';
                    return `
                        <div class="sv-key-row" style="margin-bottom:8px;">
                            <input type="url" id="svStripeLink${amount}" class="sv-input" value="${escapeForTextarea(cur)}" placeholder="${amount}€ · https://buy.stripe.com/test_...">
                            <button class="sv-btn-test" data-topup="${amount}" style="white-space:nowrap;${cur ? '' : 'opacity:0.5;'}">↗ Recarregar ${amount}€</button>
                        </div>
                    `;
                }).join('')}

                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:14px;">
                    <button id="svStripeSave" class="sv-btn">💾 Guardar config Stripe</button>
                    <button id="svPlanSave" class="sv-btn" style="background:linear-gradient(135deg,#635bff,#0a2540);">💳 Aplicar pla</button>
                </div>
                <div id="svStripeStatus" class="sv-status">✅ Saved</div>
            </div>

            <div class="sv-card" style="border-top:3px solid var(--accent-red);">
                <h3 style="color:var(--accent-red);margin-top:0;">⚠️ Danger zone</h3>
                <button id="svPurge" style="background:rgba(255,82,82,0.1);border:1px solid var(--accent-red);color:var(--accent-red);padding:10px 18px;border-radius:var(--radius-md);cursor:pointer;font-weight:bold;">🔥 Purge IndexedDB</button>
            </div>
        </div>`;
    }

    async afterRender() {
        const sel = document.getElementById('settLangSel');
        if (sel) sel.innerHTML = langSelectorHtml();

        // PERM-USER-001 sprint E+ · mock mode toggle
        try {
            const { isPermawebMockEnabled, setPermawebMockEnabled } = await import('../core/publicRegistryService.js');
            const checkbox = document.getElementById('svPermawebMock');
            const status   = document.getElementById('svPermawebMockStatus');
            const renderStatus = (on) => {
                if (!status) return;
                if (on) {
                    status.textContent = '🧪 MOCK · cap cost real · publish/revoke amb txId fake';
                    status.style.background = 'rgba(168,85,247,0.12)';
                    status.style.color = '#a855f7';
                } else {
                    status.textContent = '⚙ Mode real · publish=0.05€ · revoke=0.05€ · Turbo SDK + wallet';
                    status.style.background = 'rgba(99,102,241,0.10)';
                    status.style.color = 'var(--accent-indigo)';
                }
            };
            if (checkbox) {
                const initialOn = await isPermawebMockEnabled();
                checkbox.checked = initialOn;
                renderStatus(initialOn);
                checkbox.addEventListener('change', async () => {
                    const on = !!checkbox.checked;
                    try {
                        await setPermawebMockEnabled(on);
                        renderStatus(on);
                    } catch (err) {
                        console.error('[settings] permaweb mock toggle:', err);
                        checkbox.checked = !on;
                    }
                });
            }
        } catch (e) { console.warn('[settings] permaweb mock init', e); }


        // UX-AUDIT-001 sprint A2 · al cambiar provider, guardar in-place SIN
        // navegar. Antes esto disparaba navigateTo('/settings') aunque el
        // usuario ya hubiera salido (race condition tras tabs muy rápidos).
        document.getElementById('svProvider')?.addEventListener('change', async () => {
            const sel = document.getElementById('svProvider');
            if (!sel) return;
            const prov = sel.value || 'anthropic';
            try { await Orchestrator.setDefaultProvider(prov); } catch (_) {}
            // Pinta el "ACTIVE: ..." badge sin navegar (refresco mínimo del color
            // del select y opcional badge superior). Sin race conditions.
            sel.style.color = ({
                anthropic: 'var(--accent-purple)', openai: 'var(--accent-green)',
                deepseek: 'var(--accent-blue)', gemini: '#fbbc04',
                minimax: '#ff6b9d', custom: 'var(--text-muted)',
            })[prov] || 'var(--accent-purple)';
        });

        // Guardar todas las keys
        document.getElementById('svSave')?.addEventListener('click', async () => {
            const btn      = document.getElementById('svSave');
            const provider = document.getElementById('svProvider').value;
            const keyAnt   = document.getElementById('svKeyAnt').value.trim();
            const keyOai   = document.getElementById('svKeyOai').value.trim();
            const keyDs    = document.getElementById('svKeyDs').value.trim();
            const keyGem   = document.getElementById('svKeyGem').value.trim();
            const keyMm    = document.getElementById('svKeyMm').value.trim();
            btn.disabled   = true;
            btn.textContent = '⏳ Saving…';
            await Orchestrator.setDefaultProvider(provider);
            if (keyAnt) await Orchestrator.saveApiKey('anthropic', keyAnt);
            if (keyOai) await Orchestrator.saveApiKey('openai',    keyOai);
            if (keyDs)  await Orchestrator.saveApiKey('deepseek',  keyDs);
            if (keyGem) await Orchestrator.saveApiKey('gemini',    keyGem);
            if (keyMm)  await Orchestrator.saveApiKey('minimax',   keyMm);
            btn.textContent = '✅ Saved';
            btn.disabled    = false;
            const status = document.getElementById('svStatus');
            if (status) status.style.display = 'block';
            // UX-AUDIT-001 sprint A2 · refresca badges in-place sin navegar.
            // Antes navegaba a /settings tras 1.8s, lo que sacaba al usuario
            // de cualquier vista a la que hubiera saltado en el intervalo.
            const refreshKeyBadge = (id, val) => {
                const wrap = document.getElementById(id)?.parentElement;
                const badge = wrap?.querySelector('.sv-key-status');
                if (!badge) return;
                if (val) {
                    badge.style.background = 'rgba(0,230,118,0.12)';
                    badge.style.color = 'var(--accent-green)';
                    badge.textContent = '✓ SET';
                } else {
                    badge.style.background = 'rgba(255,255,255,0.05)';
                    badge.style.color = 'var(--text-muted)';
                    badge.textContent = '— EMPTY';
                }
            };
            refreshKeyBadge('svKeyAnt', keyAnt);
            refreshKeyBadge('svKeyOai', keyOai);
            refreshKeyBadge('svKeyDs',  keyDs);
            refreshKeyBadge('svKeyGem', keyGem);
            refreshKeyBadge('svKeyMm',  keyMm);
            setTimeout(() => {
                if (status) status.style.display = 'none';
                if (btn.isConnected) btn.textContent = '💾 Save to KB';
            }, 1800);
        });

        // Test de conexión
        document.getElementById('svTest')?.addEventListener('click', async () => {
            const btn    = document.getElementById('svTest');
            const result = document.getElementById('svTestResult');
            const provider = document.getElementById('svProvider').value;
            btn.disabled = true;
            btn.textContent = '⏳ Testing…';
            result.style.color = 'var(--text-muted)';
            result.textContent = 'Sending test request to ' + provider + '…';
            const t0 = Date.now();
            try {
                await Orchestrator.callLLM({
                    preferredEngine: provider,
                    systemPrompt:    'Reply with exactly the JSON: {"ok":true}',
                    userPrompt:      'ping',
                    responseFormat:  'json_object',
                    temperature:     0,
                });
                const ms = Date.now() - t0;
                result.style.color = 'var(--accent-green)';
                result.textContent = '✓ ' + provider + ' connected · ' + ms + 'ms';
            } catch (err) {
                result.style.color = 'var(--accent-red)';
                result.textContent = '✗ ' + err.message.slice(0, 100);
            }
            btn.disabled = false;
            btn.textContent = '⚡ Test connection';
        });

        // Purge
        // KM-001 sprint E · toggle context pruning persistido en KB
        document.getElementById('svPruningToggle')?.addEventListener('change', async (e) => {
            const on = !!e.target.checked;
            try {
                await Orchestrator.setContextPruningEnabled(on);
                const badge = document.getElementById('svPruningStatus');
                if (badge) {
                    badge.textContent = on ? '✓ ON' : '— OFF';
                    badge.style.background = on ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.05)';
                    badge.style.color      = on ? 'var(--accent-green)' : 'var(--text-muted)';
                }
            } catch (err) {
                console.error('[KM-001] toggle pruning falló:', err);
                e.target.checked = !on;
            }
        });

        // MKT-001 sprint C3 · toggle wallet charging persistido en KB
        document.getElementById('svChargingToggle')?.addEventListener('change', async (e) => {
            const on = !!e.target.checked;
            try {
                await Orchestrator.setWalletChargingEnabled(on);
                const badge = document.getElementById('svChargingStatus');
                if (badge) {
                    badge.textContent = on ? '✓ ON' : '— OFF';
                    badge.style.background = on ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.05)';
                    badge.style.color      = on ? 'var(--accent-green)' : 'var(--text-muted)';
                }
            } catch (err) {
                console.error('[MKT-001] toggle charging falló:', err);
                e.target.checked = !on;
            }
        });

        // MAT-002-G fase A · guardar / restaurar manifesto
        document.getElementById('svManifestoSave')?.addEventListener('click', async () => {
            const btn    = document.getElementById('svManifestoSave');
            const ta     = document.getElementById('svManifesto');
            const status = document.getElementById('svManifestoStatus');
            if (!btn || !ta) return;
            const text = (ta.value || '').toString();
            if (!text.trim()) {
                if (status) {
                    status.style.color = 'var(--accent-red)';
                    status.textContent = '✗ El manifesto no puede estar vacío';
                }
                return;
            }
            btn.disabled = true;
            btn.textContent = '⏳ Guardando…';
            try {
                await saveManifesto(KB, { text });
                if (status) {
                    status.style.color = 'var(--accent-green)';
                    status.textContent = isDefaultManifesto(text)
                        ? '✓ Guardado · coincide con default'
                        : '✓ Guardado · versión personalizada';
                }
                btn.textContent = '✅ Guardado';
                setTimeout(() => {
                    if (btn.isConnected) {
                        btn.textContent = '💾 Guardar manifesto';
                        btn.disabled = false;
                    }
                    if (status?.isConnected) status.textContent = '';
                }, 1500);
            } catch (err) {
                console.error('[MAT-002-G] save manifesto falló:', err);
                if (status) {
                    status.style.color = 'var(--accent-red)';
                    status.textContent = '✗ ' + (err?.message || 'error desconocido').slice(0, 100);
                }
                btn.textContent = '💾 Guardar manifesto';
                btn.disabled = false;
            }
        });

        document.getElementById('svManifestoRestore')?.addEventListener('click', async () => {
            const btn    = document.getElementById('svManifestoRestore');
            const ta     = document.getElementById('svManifesto');
            const status = document.getElementById('svManifestoStatus');
            if (!btn || !ta) return;
            if (!confirm('¿Restaurar el manifesto al default canónico de SOS V11? Tu versión actual se sobrescribirá en KB.')) return;
            btn.disabled = true;
            btn.textContent = '⏳ Restaurando…';
            try {
                await restoreDefaultManifesto(KB);
                ta.value = SOS_MANIFESTO.defaultText;
                if (status) {
                    status.style.color = 'var(--accent-green)';
                    status.textContent = '✓ Restaurado al default';
                }
                btn.textContent = '↺ Restaurar default';
                btn.disabled = false;
                setTimeout(() => {
                    if (status?.isConnected) status.textContent = '';
                }, 1200);
            } catch (err) {
                console.error('[MAT-002-G] restore manifesto falló:', err);
                if (status) {
                    status.style.color = 'var(--accent-red)';
                    status.textContent = '✗ ' + (err?.message || 'error desconocido').slice(0, 100);
                }
                btn.textContent = '↺ Restaurar default';
                btn.disabled = false;
            }
        });

        // UX-AUDIT-001 · toggle tema light/dark · in-place, sense navegar.
        // Selector `.sv-theme-btn` (NO `[data-theme]`) · després del primer
        // toggle el <body> també té `data-theme` i atraparia un listener
        // que dispararia saveTheme en cada click a `/settings`.
        document.querySelectorAll('.sv-theme-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const t = btn.getAttribute('data-theme');
                try {
                    await saveTheme(KB, t);
                    applyThemeToDocument(t);
                    // Refresca styling actiu dels dos botons sense navegar
                    document.querySelectorAll('.sv-theme-btn').forEach(b => {
                        const isMe = b.getAttribute('data-theme') === t;
                        b.classList.toggle('is-active', isMe);
                        if (b.getAttribute('data-theme') === 'dark') {
                            b.style.background = isMe ? 'linear-gradient(135deg,#0a0a0f,#1a1a22)' : 'transparent';
                            b.style.color      = isMe ? '#fff' : 'var(--text-muted)';
                            b.style.borderColor = isMe ? '#444' : 'var(--glass-border)';
                        } else {
                            b.style.background = isMe ? 'linear-gradient(135deg,#f8f8fb,#ffffff)' : 'transparent';
                            b.style.color      = isMe ? '#1a1a22' : 'var(--text-muted)';
                            b.style.borderColor = isMe ? '#aaa' : 'var(--glass-border)';
                        }
                    });
                    // Toast feedback in-place · cap navigateTo · cap race
                    const toast = document.createElement('div');
                    toast.textContent = t === 'light' ? '☀️ Tema clar aplicat' : '🌙 Tema fosc aplicat';
                    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:12px 22px;border-radius:8px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,0.25);z-index:9999;font-family:var(--font-base);font-size:14px;animation:fadeIn 0.2s ease-out;';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 1800);
                } catch (err) {
                    alert('Error canviant tema: ' + (err?.message || err));
                }
            });
        });

        // ALPHA-STRIPE-001 sprint A · validació clau pública en temps real
        const pkInput = document.getElementById('svStripePk');
        const pkStatus = document.getElementById('svStripePkStatus');
        const updatePkStatus = () => {
            if (!pkInput || !pkStatus) return;
            const v = pkInput.value.trim();
            if (!v) { pkStatus.textContent = ''; return; }
            const t = detectKeyType(v);
            if (t === 'publishable') {
                pkStatus.style.color = 'var(--accent-green)';
                pkStatus.textContent = '✓ Publishable Key vàlida (pk_)';
            } else if (t === 'secret' || t === 'restricted') {
                pkStatus.style.color = 'var(--accent-red)';
                pkStatus.textContent = '⚠️ ' + t.toUpperCase() + ' KEY · NO USIS AQUÍ · revoca-la i fes "Roll key" al dashboard Stripe';
            } else {
                pkStatus.style.color = '#fbbf24';
                pkStatus.textContent = 'format invàlid · ha de començar amb pk_test_ o pk_live_';
            }
        };
        pkInput?.addEventListener('input', updatePkStatus);
        updatePkStatus();

        // Save config Stripe
        document.getElementById('svStripeSave')?.addEventListener('click', async () => {
            const pk = pkInput?.value?.trim() || '';
            const links = {};
            for (const amount of DEFAULT_TOPUP_AMOUNTS) {
                const v = document.getElementById('svStripeLink' + amount)?.value?.trim() || '';
                if (v) links[String(amount)] = v;
            }
            // Validate before save
            if (pk && !validatePublishableKey(pk)) {
                alert('Clau Stripe inválida · ha de ser pk_test_/pk_live_ (NO sk_/rk_)');
                return;
            }
            for (const [amount, url] of Object.entries(links)) {
                if (!validatePaymentLinkUrl(url)) {
                    alert('Payment Link invàlid per ' + amount + '€ · ha de ser https://buy.stripe.com/...');
                    return;
                }
            }
            try {
                await saveStripeConfig(KB, { publishableKey: pk || null, paymentLinks: links });
                const status = document.getElementById('svStripeStatus');
                if (status) {
                    status.style.display = 'block';
                    status.textContent = '✅ Config Stripe guardada · ' + Object.keys(links).length + ' Payment Links · ' + (pk ? 'pk OK' : 'pk buit');
                    setTimeout(() => { if (status) status.style.display = 'none'; }, 2200);
                }
            } catch (err) {
                alert('Error guardant config Stripe: ' + (err?.message || err));
            }
        });

        // Apply plan · in-place feedback (no navegar)
        document.getElementById('svPlanSave')?.addEventListener('click', async () => {
            const planId = document.getElementById('svPlan')?.value;
            const btn = document.getElementById('svPlanSave');
            if (!planId || !btn) return;
            const orig = btn.textContent;
            btn.disabled = true;
            btn.textContent = '⏳ Aplicant…';
            try {
                await setCurrentPlan(KB, { planId });
                btn.textContent = '✅ Pla aplicat';
                setTimeout(() => {
                    if (btn.isConnected) { btn.textContent = orig; btn.disabled = false; }
                }, 1600);
            } catch (err) {
                btn.textContent = orig;
                btn.disabled = false;
                alert('Error aplicant pla: ' + (err?.message || err));
            }
        });

        // Topup buttons (Payment Link · obre nova tab)
        document.querySelectorAll('[data-topup]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const amount = parseInt(btn.getAttribute('data-topup'), 10);
                try {
                    await openTopupPaymentLink({ kb: KB, amountEur: amount });
                } catch (err) {
                    alert(err?.message || 'No hi ha Payment Link configurat per a ' + amount + '€ · pega la URL del Stripe Dashboard al input i guarda primer.');
                }
            });
        });

        document.getElementById('svPurge')?.addEventListener('click', () => {
            if (confirm('WARNING: This deletes ALL data (projects, roles, API keys). Cannot be undone. Continue?')) {
                localStorage.removeItem('tt_v11_fallback');
                const req = indexedDB.deleteDatabase('TeamTowers_V11');
                req.onsuccess = function() {
                    alert('Purged. Reloading…');
                    window.location.reload();
                };
                req.onerror = function() {
                    localStorage.removeItem('tt_v11_fallback');
                    alert('Purged (localStorage). Reloading…');
                    window.location.reload();
                };
            }
        });
    }
}
