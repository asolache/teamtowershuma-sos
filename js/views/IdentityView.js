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
    linkWallet, unlinkWallet, isValidEvmAddress,
} from '../core/identityService.js';
import { renderNavLinksHtml, renderNavGroupedHtml, ensureNavGroupStyle, bindNavGroupDropdowns } from '../core/navService.js';
import { renderExplainerBadge, bindExplainerBadges, ensureExplainerStyle } from '../core/didacticService.js';
// PERM-USER-001 sprint E+ refinement · permaweb publish/revoke al panell d'identitat
import {
    buildPublicRegistryEntry, signRegistryEntry, verifyRegistryEntry,
    publishToPermaweb, revokeFromPermaweb, PRICING,
    PUBLIC_REGISTRY_TYPE, registryEntryIdFor, isPermawebMockEnabled,
} from '../core/publicRegistryService.js';
import { KB } from '../core/kb.js';
import { visibleProjects } from '../core/projectFilter.js';
import { getOrCreateSigningKey } from '../core/projectIO.js';

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
            .id-shell  { height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); display:flex; flex-direction:column; overflow:hidden; }
            .id-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; flex-wrap:wrap; min-height:48px; box-sizing:border-box; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-shrink:0; flex-wrap:wrap; }
            .id-logo   { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .id-logo span { color:var(--accent-indigo); }
            .id-title  { color:var(--text-secondary); font-weight:500; letter-spacing:0.05em; text-transform:uppercase; font-size:0.78rem; }
            .id-spacer { flex:1; }
            .id-link { color:var(--text-secondary); text-decoration:none; font-size:var(--text-xs); font-weight:600; padding:6px 10px; border-radius:var(--radius-sm); transition:all var(--dur-fast); display:inline-flex; align-items:center; gap:4px; white-space:nowrap; }
            .id-link:hover { color:var(--text-main); background:var(--glass-hover); }
            .id-link:focus-visible { outline:2px solid var(--accent-indigo); outline-offset:2px; }
            .id-main   { padding:1.5rem; max-width:760px; margin:0 auto; flex:1; overflow-y:auto; width:100%; box-sizing:border-box; }
            .id-card   { background:linear-gradient(145deg,rgba(99,102,241,0.05),rgba(0,0,0,0)); border:1px solid var(--border-default); border-left:3px solid #a5b4fc; border-radius:10px; padding:1.4rem; margin-bottom:1.2rem; }
            .id-card h2 { margin:0 0 0.4rem 0; color:var(--text-main); font-size:1.1rem; }
            .id-meta   { color:var(--text-secondary); font-size:0.8rem; }
            .id-grid   { display:grid; grid-template-columns:120px 1fr; gap:0.5rem 0.9rem; margin-top:0.7rem; font-size:0.82rem; }
            .id-grid .k { color:var(--text-muted); font-family:monospace; text-transform:uppercase; font-size:0.7rem; letter-spacing:0.05em; align-self:center; }
            .id-grid .v { color:#ddd; font-family:monospace; font-size:0.75rem; word-break:break-all; }
            .id-grid .v.editable { font-family:inherit; font-size:0.85rem; }
            .id-input  { width:100%; box-sizing:border-box; background:var(--bg-elevated); border:1px solid var(--border-default); color:var(--text-main); padding:6px 9px; border-radius:5px; font-family:inherit; font-size:0.85rem; outline:none; }
            .id-input:focus { border-color:var(--accent-indigo); }
            .id-btn    { background:var(--bg-elevated); color:var(--text-main); border:1px solid var(--border-default); padding:6px 12px; border-radius:var(--radius-sm); cursor:pointer; font-size:var(--text-xs); font-weight:600; font-family:var(--font-base); line-height:1.3; display:inline-flex; align-items:center; gap:4px; white-space:nowrap; transition:all var(--dur-fast); }
            .id-btn:hover { background:var(--glass-hover); border-color:var(--accent-indigo); color:var(--text-main); }
            .id-btn:focus-visible { outline:2px solid var(--accent-indigo); outline-offset:2px; }
            .id-btn-primary { background:var(--accent-indigo); border-color:var(--accent-indigo); color:#fff; }
            .id-btn-primary:hover { background:#4f46e5; }
            .id-stub   { background:rgba(250,204,21,0.06); border:1px dashed rgba(250,204,21,0.3); border-radius:8px; padding:0.9rem; font-size:0.78rem; color:var(--accent-orange); margin-top:0.6rem; }
            .id-status { display:none; margin-top:0.6rem; font-size:0.78rem; color:var(--accent-green); }
            .id-pill   { display:inline-block; font-size:0.7rem; padding:2px 8px; border-radius:10px; background:rgba(34,197,94,0.12); color:var(--accent-green); font-family:monospace; }
        </style>

        <div class="id-shell">
            <div class="id-topbar">
                <a href="/" data-link class="id-logo">🗼 Team<span>Towers</span></a>
                <span class="id-title">Identidad · perfil del operador ${renderExplainerBadge('did', { size: 'xs' })} ${renderExplainerBadge('sbt', { size: 'xs' })}</span>
                <div class="id-spacer"></div>
                
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

                <div class="id-card" style="border-left-color:var(--accent-orange);">
                    <h2>🔗 Wallets vinculadas</h2>
                    <div class="id-meta">Direcciones Ethereum / Gnosis asociadas a esta identidad. Sprint B · binding manual (sin firma de verificación). La firma con wallet real (verifiedAt) se delega a MAT-001 fase 1 con WalletConnect.</div>

                    <div id="idWalletList" style="margin-top:0.7rem;"></div>

                    <div style="display:grid;grid-template-columns:1fr auto auto auto;gap:0.4rem;align-items:center;margin-top:0.6rem;">
                        <input id="idWalletAddr" class="id-input" type="text" placeholder="0x... (40 hex chars)" autocomplete="off" style="font-family:monospace;font-size:0.78rem;">
                        <select id="idWalletChain" class="id-input" style="width:auto;">
                            <option value="gnosis">Gnosis</option>
                            <option value="ethereum">Ethereum</option>
                            <option value="polygon">Polygon</option>
                            <option value="base">Base</option>
                            <option value="optimism">Optimism</option>
                            <option value="arbitrum">Arbitrum</option>
                            <option value="other">otra</option>
                        </select>
                        <input id="idWalletLabel" class="id-input" type="text" placeholder="etiqueta · ej. Safe matriu" style="width:160px;">
                        <button class="id-btn id-btn-primary" id="idLinkWallet">＋ Vincular</button>
                    </div>
                    <div id="idWalletErr" style="display:none;margin-top:0.4rem;font-size:0.78rem;color:var(--accent-red);"></div>
                </div>

                <div class="id-card" id="idPermawebCard" style="border-left-color:#06b6d4;">
                    <h2>🌐 Registre públic · Permaweb</h2>
                    <div class="id-meta">Publica el teu perfil al permaweb Arweave perquè altres operadors SOS puguin descobrir-te i verificar la teva identitat amb ECDSA P-256. <strong>Cost ${PRICING.publishEur.toFixed(2)}€</strong> una sola vegada · es descompta del wallet del projecte triat (no credit card). Verify és free per a tothom · publicat = visible al <a href="/registry" data-link style="color:var(--accent-indigo);">/registre</a> de qualsevol SOS local.</div>
                    <div id="idPermawebBody" style="margin-top:0.8rem;">
                        <div class="id-meta" style="font-style:italic;">Carregant estat…</div>
                    </div>
                </div>

                <div class="id-card" style="border-left-color:var(--accent-green);">
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
        ensureExplainerStyle();
        bindExplainerBadges(document);
        this._renderWalletList();
        // PERM-USER-001 sprint E+ · render permaweb card (async · llegeix KB)
        this._renderPermawebCard().catch(e => console.warn('[identity] permaweb card', e));

        document.getElementById('idLinkWallet')?.addEventListener('click', async () => {
            const addrEl  = document.getElementById('idWalletAddr');
            const chainEl = document.getElementById('idWalletChain');
            const labelEl = document.getElementById('idWalletLabel');
            const errEl   = document.getElementById('idWalletErr');
            const address = (addrEl.value || '').trim();
            const chain   = chainEl.value || 'gnosis';
            const label   = (labelEl.value || '').trim();
            errEl.style.display = 'none';
            if (!isValidEvmAddress(address)) {
                errEl.textContent = '✗ Address inválida · esperado 0x + 40 caracteres hex';
                errEl.style.display = 'block';
                return;
            }
            try {
                this.identity = await linkWallet({ address, chain, label });
                addrEl.value = ''; labelEl.value = '';
                this._renderWalletList();
            } catch (err) {
                errEl.textContent = '✗ ' + err.message;
                errEl.style.display = 'block';
            }
        });

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

    _renderWalletList() {
        const root = document.getElementById('idWalletList');
        if (!root) return;
        const wallets = Array.isArray(this.identity?.content?.wallets) ? this.identity.content.wallets : [];
        if (!wallets.length) {
            root.innerHTML = '<div style="color:var(--text-muted);font-size:0.78rem;font-style:italic;">Aún no hay wallets vinculadas.</div>';
            return;
        }
        root.innerHTML = wallets.map(w => {
            const verified = w.verifiedAt ? '<span class="id-pill" title="firma verificada">verified</span>' : '<span class="id-pill" style="background:rgba(250,204,21,0.12);color:var(--accent-orange);" title="manual binding · sin firma · upgrade a WalletConnect en MAT-001">manual</span>';
            return `<div style="display:flex;align-items:center;gap:0.5rem;padding:6px 8px;background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:5px;margin-bottom:5px;font-size:0.8rem;">
                <span style="background:rgba(125,211,252,0.15);color:#7dd3fc;padding:2px 7px;border-radius:8px;font-family:monospace;font-size:0.7rem;">${this._esc(w.chain || 'gnosis')}</span>
                <code style="color:#ddd;font-size:0.75rem;flex:1;word-break:break-all;">${this._esc(w.address)}</code>
                ${w.label ? `<span style="color:var(--text-secondary);font-size:0.72rem;">${this._esc(w.label)}</span>` : ''}
                ${verified}
                <button class="id-btn" data-unlink="${this._esc(w.address)}" style="padding:3px 8px;font-size:0.72rem;border-color:rgba(255,82,82,0.3);color:#ff5252;">Desvincular</button>
            </div>`;
        }).join('');

        root.querySelectorAll('button[data-unlink]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const addr = btn.dataset.unlink;
                if (!confirm('¿Desvincular ' + addr.slice(0, 10) + '…' + addr.slice(-4) + '?')) return;
                this.identity = await unlinkWallet(addr);
                this._renderWalletList();
            });
        });
    }

    _esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    }

    // ── PERM-USER-001 sprint E+ · Permaweb publish/revoke ─────────────────
    async _renderPermawebCard() {
        const body = document.getElementById('idPermawebBody');
        if (!body) return;
        const id = this.identity;
        if (!id) {
            body.innerHTML = '<div class="id-meta" style="color:var(--accent-orange);">Necessites identitat creada · pulsa "💾 Guardar" abans.</div>';
            return;
        }
        // Cerca entry ja publicat al KB
        let entry = null;
        try {
            const did0 = id?.content?.primaryDid || id?.primaryDid;
            if (did0) {
                const existing = await KB.getNode(registryEntryIdFor(did0));
                if (existing && existing.type === PUBLIC_REGISTRY_TYPE) entry = existing;
            }
        } catch (_) {}

        const projects = visibleProjects(store.getState().projects);
        const projectOptions = projects.map(p => `<option value="${this._esc(p.id)}">${this._esc(p.nombre || p.name || p.id)}</option>`).join('');

        const isPublished = !!(entry && entry.content?.arweaveTxId);
        const mockMode = await isPermawebMockEnabled();
        const mockBanner = mockMode
            ? '<div style="background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.40);border-radius:6px;padding:6px 10px;margin-bottom:0.7rem;font-size:0.78rem;color:#a855f7;display:flex;align-items:center;gap:6px;"><strong>🧪 MOCK MODE actiu</strong> · publish/revoke amb txId fake · cap cost real · cap upload Arweave · canvia a <a href="/settings" data-link style="color:#a855f7;text-decoration:underline;">/settings</a></div>'
            : '';

        if (isPublished) {
            const tx = entry.content.arweaveTxId;
            const publishedAt = new Date(entry.content.permawebPublishedAt || entry.content.publishedAt || 0).toLocaleDateString('ca-ES');
            const isMockTx = tx.startsWith('MOCK_TX_');
            body.innerHTML = mockBanner + `
                <div style="display:grid;grid-template-columns:1fr auto;gap:0.6rem;align-items:center;background:${isMockTx ? 'rgba(168,85,247,0.08)' : 'rgba(16,185,129,0.08)'};border:1px solid ${isMockTx ? 'rgba(168,85,247,0.30)' : 'rgba(16,185,129,0.30)'};border-radius:8px;padding:0.7rem 0.9rem;">
                    <div>
                        <div style="font-weight:700;color:${isMockTx ? '#a855f7' : 'var(--accent-green)'};">${isMockTx ? '🧪 Publicat (mock · fake tx)' : '✓ Publicat al permaweb'}</div>
                        <div class="id-meta" style="margin-top:4px;">Tx · <code style="color:var(--accent-indigo);">${this._esc(tx.slice(0,12))}…</code> · ${publishedAt}</div>
                    </div>
                    ${isMockTx ? '<span class="id-btn" style="opacity:0.6;cursor:default;" title="Mock · cap upload real">🧪 Mock</span>' : `<a href="https://arweave.net/${encodeURIComponent(tx)}" target="_blank" rel="noopener" class="id-btn">🔗 Veure tx</a>`}
                </div>
                <div style="margin-top:0.7rem;display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
                    <label class="id-meta" style="white-space:nowrap;">Wallet del projecte ·</label>
                    <select id="idPermawebProject" class="id-input" style="width:auto;flex:1;min-width:180px;">
                        <option value="">— Tria projecte —</option>
                        ${projectOptions}
                    </select>
                    <button class="id-btn" id="idPermawebRevoke" style="border-color:rgba(239,68,68,0.4);color:var(--accent-red);">🗑 Revocar (${PRICING.revokeEur.toFixed(2)}€)</button>
                </div>
                <div id="idPermawebStatus" class="id-status" style="margin-top:0.5rem;"></div>
            `;
        } else {
            body.innerHTML = mockBanner + `
                <div style="display:grid;grid-template-columns:1fr auto;gap:0.6rem;align-items:center;background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:8px;padding:0.7rem 0.9rem;">
                    <div>
                        <div style="font-weight:700;color:var(--text-secondary);">— No publicat encara</div>
                        <div class="id-meta" style="margin-top:4px;">Quan publiques · qualsevol SOS local pot descobrir-te i verificar la teva identitat.</div>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:0.85rem;color:var(--accent-indigo);font-weight:700;">${mockMode ? '0,00€ (mock)' : PRICING.publishEur.toFixed(2) + '€'}</div>
                </div>
                <div style="margin-top:0.7rem;display:grid;grid-template-columns:1fr auto;gap:0.5rem;align-items:center;">
                    <select id="idPermawebProject" class="id-input">
                        <option value="">— ${mockMode ? 'Tria projecte (mock · no descompta)' : 'Tria projecte (font del saldo)'} —</option>
                        ${projectOptions}
                    </select>
                    <button class="id-btn id-btn-primary" id="idPermawebPublish">${mockMode ? '🧪 Publicar (mock)' : '🌐 Publicar'}</button>
                </div>
                <div id="idPermawebStatus" class="id-status" style="margin-top:0.5rem;"></div>
            `;
        }
        this._bindPermawebCard(entry);
    }

    _bindPermawebCard(entry) {
        const status = () => document.getElementById('idPermawebStatus');
        const setStatus = (msg, color) => {
            const s = status();
            if (!s) return;
            s.textContent = msg;
            s.style.color = color || 'var(--accent-green)';
            s.style.display = msg ? 'block' : 'none';
        };

        document.getElementById('idPermawebPublish')?.addEventListener('click', async () => {
            const btn = document.getElementById('idPermawebPublish');
            const projSel = document.getElementById('idPermawebProject');
            const projectId = projSel?.value;
            if (!projectId) { setStatus('✗ Tria un projecte primer · el cost es descomptarà del seu wallet', 'var(--accent-orange)'); return; }
            btn.disabled = true; btn.textContent = '⏳ Signant…';
            setStatus('Construint entry · signant amb ECDSA P-256…', 'var(--text-muted)');
            try {
                // FIX 2026-05-10 · l'identity al KB és {id, type, content:{primaryDid,...}}
                // El sprint E+ refinement usava id.primaryDid (no existeix) · els camps
                // viuen dins content.
                const idNode = this.identity || {};
                const c = idNode.content || idNode;
                const did = c.primaryDid || idNode.primaryDid;
                if (!did) {
                    setStatus('✗ Identitat sense DID · pulsa 💾 Guardar més amunt primer', 'var(--accent-red)');
                    btn.disabled = false; btn.textContent = '🌐 Publicar';
                    return;
                }
                const keyMeta = await getOrCreateSigningKey();
                // Build entry des de la identitat actual
                const entry = buildPublicRegistryEntry({
                    did,
                    handle:      c.handle      || null,
                    displayName: c.displayName || 'Operador',
                    bio:         c.bio         || '',
                    avatar:      c.avatar      || null,
                    publicJwk:   keyMeta.publicJwk,
                    skillsDeclared:    c.skillsDeclared    || [],
                    sectorsExperience: c.sectorsExperience || [],
                });
                const signed = await signRegistryEntry({ entry, privateJwk: keyMeta.privateJwk });
                btn.textContent = '⏳ Pujant al permaweb…';
                setStatus('Pujant entry al permaweb via Turbo SDK…', 'var(--text-muted)');
                const result = await publishToPermaweb({ entry: signed, projectId });
                setStatus(`✓ Publicat · txId ${result.txId.slice(0,12)}… · cost ${result.costEur.toFixed(2)}€`, 'var(--accent-green)');
                setTimeout(() => this._renderPermawebCard(), 800);
            } catch (e) {
                console.error('[permaweb] publish failed', e);
                setStatus('✗ ' + (e?.message || 'error desconegut'), 'var(--accent-red)');
                btn.disabled = false; btn.textContent = '🌐 Publicar';
            }
        });

        document.getElementById('idPermawebRevoke')?.addEventListener('click', async () => {
            const btn = document.getElementById('idPermawebRevoke');
            const projSel = document.getElementById('idPermawebProject');
            const projectId = projSel?.value;
            if (!projectId) { setStatus('✗ Tria projecte (saldo)', 'var(--accent-orange)'); return; }
            if (!entry || !entry.content?.arweaveTxId) { setStatus('✗ Cap tx per revocar', 'var(--accent-red)'); return; }
            if (!confirm('Revocar el perfil públic? El registre original queda al permaweb (immutable) però amb tag revocation associat · els SOS locals que sincronitzin després el descartaran del lookup. Cost ' + PRICING.revokeEur.toFixed(2) + '€.')) return;
            btn.disabled = true; btn.textContent = '⏳ Revocant…';
            setStatus('Pujant revocation al permaweb…', 'var(--text-muted)');
            try {
                const result = await revokeFromPermaweb({
                    revokesTxId: entry.content.arweaveTxId,
                    did:         entry.content.did,
                    projectId,
                });
                // Marca l'entry local com a revocat
                try {
                    const updated = {
                        ...entry,
                        content: { ...entry.content, _revoked: true, _revocationTxId: result.revocationTxId },
                        updatedAt: Date.now(),
                    };
                    await KB.upsert(updated);
                } catch (_) {}
                setStatus(`✓ Revocat · revocation txId ${result.revocationTxId.slice(0,12)}…`, 'var(--accent-green)');
                setTimeout(() => this._renderPermawebCard(), 800);
            } catch (e) {
                console.error('[permaweb] revoke failed', e);
                setStatus('✗ ' + (e?.message || 'error desconegut'), 'var(--accent-red)');
                btn.disabled = false; btn.textContent = `🗑 Revocar (${PRICING.revokeEur.toFixed(2)}€)`;
            }
        });
    }

    destroy() {}
}
