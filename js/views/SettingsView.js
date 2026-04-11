// TEAMTOWERS SOS V11 — SETTINGS VIEW
import { store }                from '../core/store.js';
import { KB }                   from '../core/kb.js';
import { Orchestrator }         from '../core/Orchestrator.js';
import { t, langSelectorHtml }  from '../i18n.js';

export default class SettingsView {
    constructor() { document.title = 'Settings · SOS V11'; }

    async getHtml() {
        await store.init();
        const provider = await Orchestrator.getDefaultProvider();
        const keyAnt   = await Orchestrator.getApiKey('anthropic') || '';
        const keyOai   = await Orchestrator.getApiKey('openai')    || '';
        const keyDs    = await Orchestrator.getApiKey('deepseek')  || '';
        const keyGem   = await Orchestrator.getApiKey('gemini')    || '';

        const pColors  = { anthropic:'var(--accent-purple)', openai:'var(--accent-green)', deepseek:'var(--accent-blue)', gemini:'#fbbc04', custom:'var(--text-muted)' };
        const pLabels  = { anthropic:'Anthropic · claude-sonnet-4-20250514', openai:'OpenAI · GPT-4o', deepseek:'DeepSeek · V3', gemini:'Gemini · 2.0 Flash', custom:'Local / Ollama' };
        const pHints   = { anthropic:'primary · via Netlify proxy', openai:'direct API', deepseek:'direct API · code optimized', gemini:'direct API · fast multimodal', custom:'localhost:11434' };
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
            .sv-wrap { max-width:680px; margin:0 auto; padding:var(--space-8); animation:fadeIn 0.4s var(--ease-out); }
            .sv-wrap h1 { font-size:var(--text-2xl); font-weight:900; margin-bottom:var(--space-2); }
            .sv-wrap h1 span { color:var(--accent-purple); }
            .sv-card { background:linear-gradient(145deg,rgba(25,25,32,0.9),rgba(10,10,15,0.95)); border:1px solid var(--glass-border); border-radius:var(--radius-xl); padding:var(--space-8); margin-bottom:var(--space-6); }
            .sv-label { display:block; font-size:var(--text-xs); color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; font-weight:700; margin-bottom:var(--space-2); }
            .sv-input { width:100%; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); color:white; padding:12px 14px; border-radius:var(--radius-md); font-family:var(--font-mono); font-size:var(--text-sm); outline:none; transition:border-color 0.2s; box-sizing:border-box; }
            .sv-input:focus { border-color:var(--accent-purple); }
            .sv-select { font-family:var(--font-base); font-weight:700; }
            .sv-btn { background:linear-gradient(135deg,var(--accent-purple),var(--accent-indigo)); color:white; border:none; padding:12px 24px; border-radius:var(--radius-md); font-weight:900; cursor:pointer; transition:0.2s; margin-top:var(--space-4); font-size:var(--text-sm); font-family:var(--font-base); }
            .sv-btn:hover { transform:translateY(-2px); filter:brightness(1.1); }
            .sv-btn-test { background:transparent; border:1px solid var(--glass-border); color:var(--text-secondary); padding:12px 20px; border-radius:var(--radius-md); font-weight:700; cursor:pointer; transition:0.2s; margin-top:var(--space-4); margin-left:8px; font-size:var(--text-sm); font-family:var(--font-base); }
            .sv-btn-test:hover { border-color:var(--accent-green); color:var(--accent-green); }
            .sv-status { display:none; margin-top:var(--space-3); font-size:var(--text-xs); color:var(--accent-green); font-family:var(--font-mono); }
            .sv-back { display:inline-flex; align-items:center; gap:var(--space-2); color:var(--text-muted); text-decoration:none; font-size:var(--text-sm); font-weight:700; margin-bottom:var(--space-6); transition:color 0.2s; }
            .sv-back:hover { color:white; }
            .sv-active-badge { display:inline-flex; align-items:center; gap:7px; font-size:var(--text-xs); font-family:var(--font-mono); padding:5px 12px; border-radius:var(--radius-sm); font-weight:700; margin-bottom:var(--space-6); }
            .sv-key-row { display:grid; grid-template-columns:1fr auto; gap:8px; align-items:center; margin-bottom:14px; }
            .sv-key-status { font-size:9px; font-family:var(--font-mono); padding:3px 8px; border-radius:2px; font-weight:700; white-space:nowrap; }
            .sv-test-result { margin-top:10px; font-size:var(--text-xs); font-family:var(--font-mono); min-height:16px; }
        </style>

        <div class="sv-wrap">
            <a href="/" data-link class="sv-back">← Home</a>
            <h1>Settings <span>·</span> Vault</h1>
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

                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <button id="svSave" class="sv-btn">💾 Save to KB</button>
                    <button id="svTest" class="sv-btn-test">⚡ Test connection</button>
                </div>
                <div id="svTestResult" class="sv-test-result"></div>
                <div id="svStatus" class="sv-status">✅ Saved in IndexedDB</div>
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

        // Actualizar badge cuando cambia el provider
        document.getElementById('svProvider')?.addEventListener('change', () => {
            window.location.reload();
        });

        // Guardar todas las keys
        document.getElementById('svSave')?.addEventListener('click', async () => {
            const btn      = document.getElementById('svSave');
            const provider = document.getElementById('svProvider').value;
            const keyAnt   = document.getElementById('svKeyAnt').value.trim();
            const keyOai   = document.getElementById('svKeyOai').value.trim();
            const keyDs    = document.getElementById('svKeyDs').value.trim();
            const keyGem   = document.getElementById('svKeyGem').value.trim();
            btn.disabled   = true;
            btn.textContent = '⏳ Saving…';
            await Orchestrator.setDefaultProvider(provider);
            if (keyAnt) await Orchestrator.saveApiKey('anthropic', keyAnt);
            if (keyOai) await Orchestrator.saveApiKey('openai',    keyOai);
            if (keyDs)  await Orchestrator.saveApiKey('deepseek',  keyDs);
            if (keyGem) await Orchestrator.saveApiKey('gemini',    keyGem);
            btn.textContent = '✅ Saved';
            btn.disabled    = false;
            document.getElementById('svStatus').style.display = 'block';
            setTimeout(() => {
                document.getElementById('svStatus').style.display = 'none';
                btn.textContent = '💾 Save to KB';
                window.location.reload();
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
        document.getElementById('svPurge')?.addEventListener('click', () => {
            if (confirm('Purge all IndexedDB? This deletes API Keys and state.')) {
                indexedDB.deleteDatabase('TeamTowers_V11');
                alert('Purged. Reloading…');
                window.location.reload();
            }
        });
    }
}
