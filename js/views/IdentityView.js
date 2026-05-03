// =============================================================================
// TEAMTOWERS SOS V11 — IDENTITY VIEW (AUTH-001 sprint A)
// Ruta: /js/views/IdentityView.js · matchea /identity
//
// Vista del perfil del operador. Muestra el DID local-first, public key,
// metadatos · permite editar displayName/handle/avatar. Sprint B añadirá
// "Connect wallet" y "Connect OAuth" en este mismo panel.
// =============================================================================

import { store } from '../core/store.js';
import {
    getCurrentIdentity, getOrCreateIdentity, updateIdentityProfile,
} from '../core/identityService.js';
import { renderNavLinksHtml } from '../core/navService.js';

export default class IdentityView {
    constructor() {
        document.title = 'Identidad · SOS V11';
        this.identity = null;
    }

    async getHtml() {
        await store.init();
        // Crear si no existe (genera DID local-first reusando keypair ECDSA).
        this.identity = await getOrCreateIdentity();
        const c = this.identity.content || {};
        const displayName = c.displayName || '(sin nombre)';
        const handle      = c.handle      || '';
        const did         = c.primaryDid  || '—';
        const pubKey      = c.publicKeys?.signing?.x ? `${c.publicKeys.signing.x.slice(0, 10)}…${c.publicKeys.signing.x.slice(-6)}` : '—';
        const created     = c.createdAt    ? new Date(c.createdAt).toLocaleString('es-ES')    : '—';
        const lastActive  = c.lastActiveAt ? new Date(c.lastActiveAt).toLocaleString('es-ES') : '—';

        return `
        <style>
            .id-shell  { height:100dvh; background:#050507; color:#e6e6e6; font-family:var(--font-base,sans-serif); display:flex; flex-direction:column; overflow:hidden; }
            .id-topbar { display:flex; align-items:center; gap:1rem; padding:1rem 1.5rem; border-bottom:1px solid #1a1a22; background:#08080c; flex-shrink:0; flex-wrap:wrap; }
            .id-logo   { font-weight:700; color:#fff; text-decoration:none; font-size:1.05rem; }
            .id-logo span { color:#6366f1; }
            .id-title  { color:#aaa; font-weight:500; letter-spacing:0.05em; text-transform:uppercase; font-size:0.78rem; }
            .id-spacer { flex:1; }
            .id-link   { color:#6366f1; text-decoration:none; font-size:0.85rem; }
            .id-main   { padding:1.5rem; max-width:760px; margin:0 auto; flex:1; overflow-y:auto; width:100%; box-sizing:border-box; }
            .id-card   { background:linear-gradient(145deg,rgba(99,102,241,0.05),rgba(0,0,0,0)); border:1px solid #1a1a22; border-left:3px solid #a5b4fc; border-radius:10px; padding:1.4rem; margin-bottom:1.2rem; }
            .id-card h2 { margin:0 0 0.4rem 0; color:#fff; font-size:1.1rem; }
            .id-meta   { color:#aaa; font-size:0.8rem; }
            .id-grid   { display:grid; grid-template-columns:120px 1fr; gap:0.5rem 0.9rem; margin-top:0.7rem; font-size:0.82rem; }
            .id-grid .k { color:#888; font-family:monospace; text-transform:uppercase; font-size:0.7rem; letter-spacing:0.05em; align-self:center; }
            .id-grid .v { color:#ddd; font-family:monospace; font-size:0.75rem; word-break:break-all; }
            .id-grid .v.editable { font-family:inherit; font-size:0.85rem; }
            .id-input  { width:100%; box-sizing:border-box; background:rgba(0,0,0,0.3); border:1px solid #2a2a35; color:#e6e6e6; padding:6px 9px; border-radius:5px; font-family:inherit; font-size:0.85rem; outline:none; }
            .id-input:focus { border-color:#a5b4fc; }
            .id-btn    { background:#1a1a22; color:#e6e6e6; border:1px solid #2a2a35; padding:0.5rem 1rem; border-radius:6px; cursor:pointer; font-family:inherit; font-size:0.85rem; }
            .id-btn:hover { background:#22222d; }
            .id-btn-primary { background:#6366f1; border-color:#6366f1; color:#fff; }
            .id-btn-primary:hover { background:#4f46e5; }
            .id-stub   { background:rgba(250,204,21,0.06); border:1px dashed rgba(250,204,21,0.3); border-radius:8px; padding:0.9rem; font-size:0.78rem; color:#facc15; margin-top:0.6rem; }
            .id-status { display:none; margin-top:0.6rem; font-size:0.78rem; color:#86efac; }
            .id-pill   { display:inline-block; font-size:0.7rem; padding:2px 8px; border-radius:10px; background:rgba(34,197,94,0.12); color:#86efac; font-family:monospace; }
        </style>

        <div class="id-shell">
            <div class="id-topbar">
                <a href="/" data-link class="id-logo">🗼 Team<span>Towers</span></a>
                <span class="id-title">Identidad · perfil del operador</span>
                <div class="id-spacer"></div>
                ${renderNavLinksHtml({ active: '', className: 'id-link' })}
            </div>

            <div class="id-main">
                <div class="id-card">
                    <h2>👤 ${this._esc(displayName)} ${handle ? `<span class="id-pill">${this._esc(handle)}</span>` : ''}</h2>
                    <div class="id-meta">Identidad <strong>local-first</strong> · clave ECDSA P-256 generada en este dispositivo · nunca sale del navegador</div>

                    <div class="id-grid">
                        <div class="k">Nombre</div>
                        <div class="v editable"><input id="idDisplayName" class="id-input" type="text" value="${this._esc(c.displayName || '')}" placeholder="Tu nombre"></div>
                        <div class="k">Handle</div>
                        <div class="v editable"><input id="idHandle" class="id-input" type="text" value="${this._esc(c.handle || '')}" placeholder="@tu-handle"></div>
                        <div class="k">DID</div>
                        <div class="v" id="idDid">${this._esc(did)}</div>
                        <div class="k">Pub key</div>
                        <div class="v" id="idPub">${this._esc(pubKey)}</div>
                        <div class="k">Creada</div>
                        <div class="v">${this._esc(created)}</div>
                        <div class="k">Último uso</div>
                        <div class="v">${this._esc(lastActive)}</div>
                    </div>

                    <div style="display:flex;gap:0.5rem;margin-top:1rem;flex-wrap:wrap;">
                        <button class="id-btn id-btn-primary" id="idSave">💾 Guardar</button>
                        <button class="id-btn" id="idCopyDid">📋 Copiar DID</button>
                        <a class="id-btn" href="/n/${encodeURIComponent(this.identity.id)}" data-link>📂 Ver nodo</a>
                    </div>
                    <div class="id-status" id="idStatus">✓ Guardado</div>
                </div>

                <div class="id-card" style="border-left-color:#facc15;">
                    <h2>🔗 Conectar wallet</h2>
                    <div class="id-meta">Vincula una dirección Ethereum/Gnosis a tu identidad para firmar tx, recibir hats SBT y participar en FICE rounds.</div>
                    <div class="id-stub">🚧 Sprint B · WalletConnect/RainbowKit/Safe SDK · delegado a MAT-001 fase 1.</div>
                </div>

                <div class="id-card" style="border-left-color:#86efac;">
                    <h2>🪪 Conectar OAuth</h2>
                    <div class="id-meta">Vincula GitHub · Google · email magic-link para que otros operadores te encuentren sin necesidad de cripto.</div>
                    <div class="id-stub">🚧 Sprint C · Netlify Functions + OAuth providers · delegado.</div>
                </div>

                <div class="id-card" style="border-left-color:#94a3b8;background:rgba(148,163,184,0.04);">
                    <h2>🛡 Seguridad</h2>
                    <div class="id-meta">Tu clave privada se guarda en IndexedDB sin cifrar (sprint A). Antes de la alfa privada (BILL-001) la cifraremos con passphrase obligatoria.</div>
                </div>
            </div>
        </div>`;
    }

    async afterRender() {
        document.getElementById('idSave')?.addEventListener('click', async () => {
            const btn = document.getElementById('idSave');
            const displayName = document.getElementById('idDisplayName').value;
            const handle      = document.getElementById('idHandle').value;
            btn.disabled = true; btn.textContent = '⏳ Guardando…';
            try {
                this.identity = await updateIdentityProfile({ displayName, handle });
                const status = document.getElementById('idStatus');
                if (status) { status.style.display = 'block'; setTimeout(() => status.style.display = 'none', 2000); }
            } catch (err) {
                console.error('[AUTH-001] Error guardando identity:', err);
                alert('Error: ' + err.message);
            } finally {
                btn.disabled = false; btn.textContent = '💾 Guardar';
            }
        });

        document.getElementById('idCopyDid')?.addEventListener('click', async () => {
            const did = this.identity?.content?.primaryDid || '';
            try { await navigator.clipboard.writeText(did); alert('DID copiado: ' + did); }
            catch (_) { alert('No se pudo copiar (permiso denegado).'); }
        });
    }

    _esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    }

    destroy() {}
}
