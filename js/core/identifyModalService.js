// =============================================================================
// TEAMTOWERS SOS V11 — IDENTIFY MODAL SERVICE (WALLET-AUTH-001 sprint D)
//
// Modal unificat "🔑 Identifica't" amb 3 camins compatibles:
//   🦊 Wallet     · Wander/ArConnect (Arweave) + WalletConnect (EVM · stub)
//   🪪 OAuth      · GitHub · Google · Magic-link (stubs · sprint C2 futur)
//   💾 Local-first· DID generat al teu dispositiu (default · zero deps)
//
// Filosofia · els 3 camins són compatibles · l'usuari pot començar amb
// local-first, conectar wallet més endavant, afegir OAuth perquè altres
// el trobin. Modal centra els paths en una UI única + clarifica tradeoffs
// (privacitat · portabilitat · funcionalitat).
//
// Stateless · cada `openIdentifyModal()` injecta DOM nou. Tanca · removes.
// Exposa wallets connectats actuals · OAuth providers vinculats.
// =============================================================================

import { isWanderAvailable, connectWander, getWanderConnection } from './arweaveWalletService.js';

const MODAL_ID = 'sos-identify-modal';

function _esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

// Llegeix l'identitat actual (DID local) del KB · fallback null
async function _loadCurrentIdentity() {
    try {
        const { getCurrentIdentity } = await import('./identityService.js');
        return await getCurrentIdentity();
    } catch (_) { return null; }
}

// State observable per a UI · evita re-fetch a cada tab switch
let _modalState = {
    activeTab:  'wallet',
    identity:   null,        // user_identity node
    wallet:     null,        // {address, source, connectedAt}
};

// renderModalHtml · pur · zero side effects · pinta el modal sencer
export function renderModalHtml({ activeTab = 'wallet', identity = null, wallet = null, wanderAvailable = false } = {}) {
    const didShort = identity?.primaryDid
        ? (identity.primaryDid.slice(0, 16) + '…' + identity.primaryDid.slice(-6))
        : null;
    const tabsHtml = [
        { id: 'wallet',  icon: '🦊', label: 'Wallet',     hint: 'Cripto · max control' },
        { id: 'oauth',   icon: '🪪', label: 'OAuth',      hint: 'Onboarding ràpid' },
        { id: 'local',   icon: '💾', label: 'Local-first',hint: 'DID dispositiu · default' },
    ].map(t => {
        const active = t.id === activeTab;
        const style = active
            ? 'background:var(--accent-indigo);color:#fff;border:1px solid var(--accent-indigo);'
            : 'background:var(--bg-elevated);color:var(--text-secondary);border:1px solid var(--border-default);';
        return `<button data-tab="${t.id}" title="${t.hint}" style="${style}padding:8px 16px;border-radius:var(--radius-md);font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:0.85rem;">${t.icon} ${t.label}</button>`;
    }).join('');

    // ── Tab 1 · Wallet ──────────────────────────────────────────────────
    let walletBody;
    if (wallet && wallet.address) {
        const short = wallet.address.slice(0, 10) + '…' + wallet.address.slice(-6);
        walletBody = `
            <div style="padding:14px;background:rgba(0,230,118,0.06);border:1px solid rgba(0,230,118,0.30);border-radius:8px;">
                <div style="font-weight:700;color:#00e676;font-size:0.9rem;">✓ ${_esc(wallet.source || 'wallet')} connectat</div>
                <div style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted);margin-top:4px;">${_esc(short)}</div>
            </div>
            <p style="font-size:0.78rem;color:var(--text-muted);margin-top:0.8rem;line-height:1.5;">
                La teva wallet Arweave està connectada · permet signar entries directament al permaweb sense JWK keyfile.
                <a href="/identity" data-link style="color:var(--accent-indigo);">Veure detalls →</a>
            </p>`;
    } else if (wanderAvailable) {
        walletBody = `
            <p style="font-size:0.85rem;line-height:1.5;color:var(--text-secondary);">
                Detectat <strong>Wander / ArConnect</strong> al teu navegador. Connecta la teva wallet Arweave per signar publishes sense exportar JWK.
            </p>
            <button data-action="connect-wander" style="background:linear-gradient(135deg,#a855f7,#6366f1);color:#fff;border:0;padding:10px 18px;border-radius:var(--radius-md);font-weight:700;cursor:pointer;font-size:0.9rem;margin-top:0.6rem;">🦊 Connect Wander</button>
            <div data-wallet-status style="margin-top:0.6rem;font-size:0.78rem;"></div>`;
    } else {
        walletBody = `
            <div style="padding:14px;background:rgba(168,85,247,0.05);border:1px solid rgba(168,85,247,0.20);border-radius:8px;">
                <div style="font-weight:700;font-size:0.85rem;">🛈 Wander no detectat</div>
                <p style="font-size:0.78rem;color:var(--text-muted);margin-top:6px;line-height:1.5;">
                    Instal·la l'extensió Wander/ArConnect des de
                    <a href="https://www.wander.app/" target="_blank" rel="noopener" style="color:var(--accent-indigo);">wander.app ↗</a>
                    i recarrega la pàgina · o fes servir keyfile JSON al <a href="/identity" data-link style="color:var(--accent-indigo);">/identity</a>.
                </p>
            </div>
            <p style="font-size:0.72rem;color:var(--text-muted);margin-top:0.8rem;line-height:1.45;">
                <strong>WalletConnect EVM</strong> (MetaMask · Rainbow · Safe · etc.) arribarà al sprint B amb Reown AppKit · permetrà signar tx EVM addicionals al DID local.
            </p>`;
    }

    // ── Tab 2 · OAuth ───────────────────────────────────────────────────
    const oauthBody = `
        <p style="font-size:0.85rem;line-height:1.5;color:var(--text-secondary);">
            Vincula un proveïdor OAuth per a <strong>onboarding ràpid sense cripto</strong> · útil per a stakeholders no-técnics (comentaris · subscripcions workshops · etc.). El DID local segueix sent l'identificador canònic per a signatures.
        </p>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:0.8rem;">
            <button data-action="oauth-github" style="background:#24292e;color:#fff;border:0;padding:10px 14px;border-radius:var(--radius-md);font-weight:600;cursor:pointer;font-size:0.85rem;display:flex;align-items:center;gap:8px;">
                <span>⚙</span> GitHub <span style="opacity:0.6;font-size:0.75rem;margin-left:auto;">sprint C futur</span>
            </button>
            <button data-action="oauth-google" style="background:#fff;color:#333;border:1px solid #ccc;padding:10px 14px;border-radius:var(--radius-md);font-weight:600;cursor:pointer;font-size:0.85rem;display:flex;align-items:center;gap:8px;">
                <span style="color:#4285f4;">G</span> Google <span style="opacity:0.5;font-size:0.75rem;margin-left:auto;color:#888;">sprint C futur</span>
            </button>
            <button data-action="oauth-magic" style="background:var(--bg-elevated);color:var(--text-main);border:1px solid var(--border-default);padding:10px 14px;border-radius:var(--radius-md);font-weight:600;cursor:pointer;font-size:0.85rem;display:flex;align-items:center;gap:8px;">
                <span>✉</span> Magic-link · email <span style="opacity:0.6;font-size:0.75rem;margin-left:auto;">sprint C futur</span>
            </button>
        </div>
        <p style="font-size:0.72rem;color:var(--text-muted);margin-top:0.8rem;line-height:1.45;">
            🚧 Necessita Netlify Function backend (sprint C de WALLET-AUTH-001 · 2.5h). De moment els botons són stubs.
        </p>
        <div data-oauth-status style="margin-top:0.6rem;font-size:0.78rem;"></div>`;

    // ── Tab 3 · Local-first ─────────────────────────────────────────────
    const localBody = `
        <p style="font-size:0.85rem;line-height:1.5;color:var(--text-secondary);">
            <strong>Local-first</strong> és el mètode default · cada dispositiu genera la seva clau ECDSA P-256 i un DID determinístic
            <code style="background:var(--bg-elevated);padding:1px 4px;border-radius:3px;font-size:0.75rem;">did:sos:{32hex}</code>
            sense xarxa. Zero dependència de servidors externs · max privacitat.
        </p>
        ${didShort ? `
            <div style="padding:14px;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.30);border-radius:8px;margin-top:0.8rem;">
                <div style="font-weight:700;font-size:0.85rem;">✓ DID local actiu</div>
                <div style="font-family:var(--font-mono);font-size:0.75rem;color:var(--accent-indigo);margin-top:4px;">${_esc(didShort)}</div>
                <button data-action="copy-did" style="background:transparent;border:1px solid var(--border-default);color:var(--text-secondary);padding:4px 10px;border-radius:4px;font-size:0.72rem;font-weight:600;cursor:pointer;margin-top:8px;">📋 Copia DID complet</button>
            </div>
        ` : `
            <div style="padding:14px;background:rgba(250,204,21,0.05);border:1px solid rgba(250,204,21,0.30);border-radius:8px;margin-top:0.8rem;">
                <div style="font-weight:700;font-size:0.85rem;color:var(--accent-orange);">⚠ Encara sense DID local</div>
                <p style="font-size:0.78rem;color:var(--text-muted);margin-top:6px;">Ves a <a href="/identity" data-link style="color:var(--accent-indigo);">/identity</a> i prem "Guardar" per crear la teva primera clau ECDSA local.</p>
            </div>
        `}
        <p style="font-size:0.72rem;color:var(--text-muted);margin-top:0.8rem;line-height:1.45;">
            🛡 Privacitat · la clau privada viu sols al teu navegador (IndexedDB). Pre-alfa la xifrarem amb passphrase obligatoria (BILL-001 sprint D futur).
        </p>`;

    const activeBody = activeTab === 'wallet' ? walletBody
                     : activeTab === 'oauth'  ? oauthBody
                     :                          localBody;

    return `
        <div data-im-overlay style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9995;display:flex;align-items:center;justify-content:center;padding:20px;">
            <div style="background:var(--bg-panel);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:1.6rem;max-width:560px;width:100%;max-height:90vh;overflow:auto;color:var(--text-main);box-shadow:var(--shadow-lg);">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
                    <h2 style="margin:0;font-size:1.3rem;color:var(--text-main);">🔑 Identifica't</h2>
                    <button data-action="close" style="background:transparent;border:0;color:var(--text-muted);font-size:1.4rem;cursor:pointer;padding:4px 8px;line-height:1;">×</button>
                </div>
                <p style="font-size:0.85rem;color:var(--text-muted);line-height:1.5;margin-bottom:1rem;">
                    Tria com vols identificar-te al SOS. Els 3 camins són compatibles · pots combinar-los segons et calgui.
                </p>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1.2rem;">${tabsHtml}</div>
                <div data-im-body>${activeBody}</div>
            </div>
        </div>
    `;
}

// openIdentifyModal · async · carrega state + injecta DOM + bind handlers
export async function openIdentifyModal({ initialTab = 'wallet' } = {}) {
    // Tanca qualsevol modal existent
    closeIdentifyModal();
    // Carrega state
    _modalState = {
        activeTab: initialTab,
        identity:  await _loadCurrentIdentity().catch(() => null),
        wallet:    await getWanderConnection().catch(() => null),
    };
    const wanderAvailable = isWanderAvailable();
    const wrap = document.createElement('div');
    wrap.id = MODAL_ID;
    wrap.innerHTML = renderModalHtml({
        activeTab:      _modalState.activeTab,
        identity:       _modalState.identity,
        wallet:         _modalState.wallet,
        wanderAvailable,
    });
    document.body.appendChild(wrap);
    _bindModal(wrap);
}

export function closeIdentifyModal() {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(MODAL_ID);
    if (el) el.remove();
}

function _rerender() {
    const root = document.getElementById(MODAL_ID);
    if (!root) return;
    root.innerHTML = renderModalHtml({
        activeTab:      _modalState.activeTab,
        identity:       _modalState.identity,
        wallet:         _modalState.wallet,
        wanderAvailable: isWanderAvailable(),
    });
    _bindModal(root);
}

function _bindModal(root) {
    if (!root) return;
    // Close · click overlay backdrop o "×"
    root.querySelector('[data-im-overlay]')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeIdentifyModal();
    });
    root.querySelector('[data-action="close"]')?.addEventListener('click', closeIdentifyModal);
    // Tabs
    root.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            _modalState.activeTab = btn.dataset.tab;
            _rerender();
        });
    });
    // Wallet connect
    root.querySelector('[data-action="connect-wander"]')?.addEventListener('click', async (e) => {
        const status = root.querySelector('[data-wallet-status]');
        if (status) { status.textContent = '⏳ Connectant…'; status.style.color = 'var(--accent-orange)'; }
        try {
            const conn = await connectWander();
            _modalState.wallet = conn;
            _rerender();
        } catch (err) {
            if (status) { status.textContent = '✗ ' + (err?.message || 'cancel·lat'); status.style.color = 'var(--accent-red)'; }
        }
    });
    // OAuth stubs
    ['github', 'google', 'magic'].forEach(p => {
        root.querySelector('[data-action="oauth-' + p + '"]')?.addEventListener('click', () => {
            const status = root.querySelector('[data-oauth-status]');
            if (status) {
                status.innerHTML = '🚧 OAuth ' + p + ' arribarà al sprint C de WALLET-AUTH-001 · necessita Netlify Function backend.';
                status.style.color = 'var(--text-muted)';
            }
        });
    });
    // Local · copy DID
    root.querySelector('[data-action="copy-did"]')?.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(_modalState.identity?.primaryDid || '');
            // Feedback inline · canvia text botó breument
            const btn = root.querySelector('[data-action="copy-did"]');
            if (btn) {
                const orig = btn.textContent;
                btn.textContent = '✓ Copiat';
                setTimeout(() => { btn.textContent = orig; }, 1400);
            }
        } catch (_) {}
    });
}

// Trigger HTML estandardarditzat per a botons "🔑 Identifica't"
// La vista que el monta crida openIdentifyModal() al click.
export function identifyButtonHtml({ size = 'sm' } = {}) {
    const padding = size === 'lg' ? '10px 18px' : '6px 12px';
    const fontSize = size === 'lg' ? '0.9rem' : '0.78rem';
    return `<button data-open-identify style="background:linear-gradient(135deg,#a855f7,#6366f1);color:#fff;border:0;padding:${padding};border-radius:var(--radius-md);font-weight:700;cursor:pointer;font-size:${fontSize};display:inline-flex;align-items:center;gap:6px;">🔑 Identifica't</button>`;
}

// bindIdentifyTriggers · idempotent · click delegation per `[data-open-identify]`
let _delegationBound = false;
export function bindIdentifyTriggers() {
    if (_delegationBound || typeof document === 'undefined') return;
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-open-identify]');
        if (!btn) return;
        e.preventDefault();
        const tab = btn.getAttribute('data-identify-tab') || 'wallet';
        openIdentifyModal({ initialTab: tab }).catch(err => console.warn('[identifyModal]', err?.message));
    });
    _delegationBound = true;
}

// Reset for tests
export function _resetIdentifyModal() {
    closeIdentifyModal();
    _delegationBound = false;
    _modalState = { activeTab: 'wallet', identity: null, wallet: null };
}
