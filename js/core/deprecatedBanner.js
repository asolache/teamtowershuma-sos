// =============================================================================
// TEAMTOWERS SOS V11 — DEPRECATED BANNER (V2-EVOL Fase A)
// Ruta · /js/core/deprecatedBanner.js
//
// Component reutilitzable per a senyalitzar vistes V1 en transició a V2.
// Veure `docs/STUDY-v2-evolution-plan-2026-05-16.md` per al plan complet.
//
// Ús · `${renderDeprecatedBanner({ canonicalPath, canonicalLabel, reason, etaSprint })}`
// dins el shell de qualsevol vista V1.
//
// Pure HTML · safe en Node · zero binding (l'enllaç respecta `data-link`
// per al router del SOS).
// =============================================================================

const CSS_ID = 'sos-deprecated-banner-css';

// _ensureCss · pure DOM · idempotent · injecta el CSS una sola vegada
export function ensureDeprecatedBannerStyle() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(CSS_ID)) return;
    const style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent = `
        .sos-depr-banner {
            position: relative;
            background: linear-gradient(135deg, rgba(250,204,21,0.10), rgba(239,68,68,0.06));
            border: 1px solid rgba(250,204,21,0.40);
            border-left: 4px solid #facc15;
            border-radius: 8px;
            padding: 12px 16px;
            margin: 0 0 16px 0;
            font-family: var(--font-base, system-ui, sans-serif);
            font-size: 0.85rem;
            color: var(--text-main, #e2e8f0);
            display: flex;
            gap: 12px;
            align-items: flex-start;
            line-height: 1.5;
        }
        .sos-depr-banner .icon {
            font-size: 1.3rem; line-height: 1; flex-shrink: 0; padding-top: 1px;
        }
        .sos-depr-banner .body { flex: 1; min-width: 0; }
        .sos-depr-banner .title {
            font-weight: 800; color: #facc15;
            display: block; margin-bottom: 2px; font-size: 0.84rem;
            text-transform: uppercase; letter-spacing: 0.06em;
        }
        .sos-depr-banner .reason {
            color: var(--text-secondary, #94a3b8);
            font-size: 0.82rem; margin: 4px 0 8px 0;
        }
        .sos-depr-banner .cta {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 5px 12px; border-radius: 999px;
            background: var(--accent-indigo, #6366f1); color: #fff;
            text-decoration: none; font-weight: 700; font-size: 0.78rem;
            border: 1px solid transparent;
        }
        .sos-depr-banner .cta:hover { filter: brightness(1.12); }
        .sos-depr-banner .eta {
            display: inline-block; margin-left: 8px;
            font-size: 0.7rem; color: var(--text-muted, #64748b);
        }
        @media (max-width: 600px) {
            .sos-depr-banner { padding: 10px 12px; font-size: 0.82rem; }
            .sos-depr-banner .title { font-size: 0.78rem; }
        }
    `;
    document.head.appendChild(style);
}

// _esc · pure · escape HTML
function _esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// renderDeprecatedBanner · pure · retorna l'HTML del banner.
//
// Args (tots opcionals · defaults raonables) ·
//   canonicalPath  · ruta V2 oficial (ex. '/settings-v2')
//   canonicalLabel · text del botó CTA (ex. 'Settings V2')
//   reason         · motiu humà (ex. 'Aquesta versió quedarà obsoleta pre-alfa')
//   etaSprint      · etiqueta temporal (ex. 'pre-alfa privada')
//   title          · capçalera del banner (default 'Vista legacy')
export function renderDeprecatedBanner({
    canonicalPath  = '/',
    canonicalLabel = 'Vista oficial',
    reason         = 'Aquesta vista serà eliminada quan tota la funcionalitat estigui a la versió V2 (sprint pre-alfa).',
    etaSprint      = 'pre-alfa',
    title          = 'Vista legacy · V1',
} = {}) {
    const path = _esc(canonicalPath);
    return `
    <aside class="sos-depr-banner" role="status" aria-label="Avís · vista legacy">
        <span class="icon" aria-hidden="true">⚠</span>
        <div class="body">
            <span class="title">${_esc(title)}</span>
            <div class="reason">${_esc(reason)}</div>
            <a class="cta" href="${path}" data-link aria-label="Anar a ${_esc(canonicalLabel)}">
                Anar a ${_esc(canonicalLabel)} →
            </a>
            <span class="eta">ETA · ${_esc(etaSprint)}</span>
        </div>
    </aside>`;
}

// renderCanonicalBadge · pure · senyala que la vista actual ÉS la V2 oficial.
// Útil per a posar al topbar/hero de la V2 perquè l'usuari sàpiga que ja és la bona.
export function renderCanonicalBadge({
    label = 'V2 · oficial',
    title = 'Aquesta és la versió oficial de la vista · les variants legacy seran eliminades pre-alfa.',
} = {}) {
    return `
    <span class="sos-canonical-badge" style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:rgba(34,197,94,0.14);color:#22c55e;border:1px solid rgba(34,197,94,0.35);font-size:0.7rem;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;" title="${_esc(title)}">✓ ${_esc(label)}</span>`;
}
