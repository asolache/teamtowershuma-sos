// TEAMTOWERS SOS V11 — SETTINGS VIEW
import { store }       from '../core/store.js';
import { KB }          from '../core/kb.js';
import { Orchestrator } from '../core/Orchestrator.js';

export default class SettingsView {
    constructor() { document.title = 'Settings · SOS V11'; }

    async getHtml() {
        await store.init();
        const provider = await Orchestrator.getDefaultProvider();
        const keyAnt   = await Orchestrator.getApiKey('anthropic') || '';

        return `
        <style>
            .settings-wrap { max-width:640px; margin:0 auto; padding:var(--space-8); animation:fadeIn 0.4s var(--ease-out); }
            .settings-wrap h1 { font-size:var(--text-2xl); font-weight:900; margin-bottom:var(--space-2); }
            .settings-wrap h1 span { color:var(--accent-purple); }
            .sv-card { background:linear-gradient(145deg,rgba(25,25,32,0.9),rgba(10,10,15,0.95)); border:1px solid var(--glass-border); border-radius:var(--radius-xl); padding:var(--space-8); margin-bottom:var(--space-6); }
            .sv-label { display:block; font-size:var(--text-xs); color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; font-weight:700; margin-bottom:var(--space-2); }
            .sv-input { width:100%; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); color:white; padding:12px 14px; border-radius:var(--radius-md); font-family:var(--font-mono); font-size:var(--text-sm); outline:none; transition:border-color var(--dur-fast); box-sizing:border-box; }
            .sv-input:focus { border-color:var(--accent-purple); }
            .sv-select { font-family:var(--font-base); font-weight:700; color:var(--accent-purple); }
            .sv-btn { background:linear-gradient(135deg,var(--accent-purple),var(--accent-indigo)); color:white; border:none; padding:12px 24px; border-radius:var(--radius-md); font-weight:900; cursor:pointer; transition:0.2s; margin-top:var(--space-4); font-size:var(--text-sm); }
            .sv-btn:hover { transform:translateY(-2px); filter:brightness(1.1); }
            .sv-status { display:none; margin-top:var(--space-3); font-size:var(--text-xs); color:var(--accent-green); font-family:var(--font-mono); }
            .sv-back { display:inline-flex; align-items:center; gap:var(--space-2); color:var(--text-muted); text-decoration:none; font-size:var(--text-sm); font-weight:700; margin-bottom:var(--space-6); transition:color var(--dur-fast); }
            .sv-back:hover { color:white; }
        </style>

        <div class="settings-wrap">
            <a href="/" data-link class="sv-back">← Inicio</a>
            <h1>Settings <span>·</span> Bóveda</h1>
            <p style="color:var(--text-muted);margin-bottom:var(--space-8);">API Keys · Motor IA · IndexedDB (zero localStorage)</p>

            <div class="sv-card">
                <div style="margin-bottom:var(--space-6);">
                    <label class="sv-label">Motor primario</label>
                    <select id="svProvider" class="sv-input sv-select">
                        <option value="anthropic" ${provider==='anthropic'?'selected':''}>✦ Anthropic (claude-sonnet-4-20250514)</option>
                        <option value="openai"    ${provider==='openai'   ?'selected':''}>OpenAI (GPT-4o)</option>
                        <option value="deepseek"  ${provider==='deepseek' ?'selected':''}>DeepSeek (V3)</option>
                        <option value="gemini"    ${provider==='gemini'   ?'selected':''}>Google Gemini 2.0 Flash</option>
                        <option value="custom"    ${provider==='custom'   ?'selected':''}>Local / Ollama</option>
                    </select>
                </div>
                <div style="margin-bottom:var(--space-4);">
                    <label class="sv-label">Anthropic API Key <span style="color:var(--accent-green);">(primario · via proxy Netlify)</span></label>
                    <input type="password" id="svKeyAnt" class="sv-input" value="${keyAnt}" placeholder="sk-ant-api03-...">
                </div>
                <button id="svSave" class="sv-btn">💾 Guardar en KB</button>
                <div id="svStatus" class="sv-status">✅ Guardado en IndexedDB</div>
            </div>

            <div class="sv-card" style="border-top:3px solid var(--accent-red);">
                <h3 style="color:var(--accent-red);margin-top:0;">⚠️ Zona de peligro</h3>
                <button id="svPurge" style="background:rgba(255,82,82,0.1);border:1px solid var(--accent-red);color:var(--accent-red);padding:10px 18px;border-radius:var(--radius-md);cursor:pointer;font-weight:bold;">🔥 Purgar IndexedDB</button>
            </div>
        </div>`;
    }

    async afterRender() {
        document.getElementById('svSave')?.addEventListener('click', async () => {
            const btn      = document.getElementById('svSave');
            const provider = document.getElementById('svProvider').value;
            const keyAnt   = document.getElementById('svKeyAnt').value.trim();
            btn.disabled   = true;
            btn.textContent= '⏳ Guardando…';
            await Orchestrator.setDefaultProvider(provider);
            if (keyAnt) await Orchestrator.saveApiKey('anthropic', keyAnt);
            btn.textContent= '✅ Guardado';
            btn.disabled   = false;
            document.getElementById('svStatus').style.display = 'block';
            setTimeout(() => { document.getElementById('svStatus').style.display = 'none'; btn.textContent = '💾 Guardar en KB'; }, 3000);
        });

        document.getElementById('svPurge')?.addEventListener('click', () => {
            if (confirm('¿Purgar toda la IndexedDB? Esto borra API Keys y estado.')) {
                indexedDB.deleteDatabase('TeamTowers_V11');
                alert('Purgado. Recargando…');
                window.location.reload();
            }
        });
    }
}
