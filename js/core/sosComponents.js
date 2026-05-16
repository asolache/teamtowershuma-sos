// =============================================================================
// TEAMTOWERS SOS V11 — SOS COMPONENTS (DESIGN-SYSTEM sprint B)
// Ruta · /js/core/sosComponents.js
//
// HTML helpers pure per a components reutilitzables · cards · chips · empty
// states · progress bars · stat-tiles. Aplica TOKENS de sosCopy.
//
// KISS · cada helper retorna un string HTML autocontingut amb estils inline.
// DRY · cap view duplica markup d'aquests components.
//
// SECURITY · TOTS els helpers escapen text · zero risc XSS.
// =============================================================================

import { TOKENS, label } from './sosCopy.js';

// _esc · helper privat · escape HTML safe (DRY · usat per tots)
function _esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// renderChip · pill amb color customitzable · KISS · color hex automàticament
// genera tint background (color25) + border (color50).
//
// args · { label, color, icon?, title? } · color default primary
export function renderChip({ label: text = '', color = TOKENS.colors.primary, icon = null, title = null } = {}) {
    const t = title ? ` title="${_esc(title)}"` : '';
    const i = icon ? _esc(icon) + ' ' : '';
    return `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:${TOKENS.radii.pill};background:${color}25;color:${color};border:1px solid ${color}50;font-size:11px;font-weight:600;font-family:var(--font-mono);"${t}>${i}${_esc(text)}</span>`;
}

// renderStatCard · stat tile · KISS · num gran + label petit + icona
//
// args · { num, label, color?, icon?, title?, big? }
export function renderStatCard({ num, label: txt = '', color = TOKENS.colors.primary, icon = null, title = null, big = false } = {}) {
    const t = title ? ` title="${_esc(title)}"` : '';
    const size = big ? '1.6rem' : '1.4rem';
    return `<div style="background:var(--bg-panel);border:1px solid var(--border-default);border-left:3px solid ${color};border-radius:${TOKENS.radii.md};padding:10px 12px;text-align:center;"${t}>
        <span style="display:block;font-size:${size};font-weight:700;font-family:var(--font-mono);color:${color};">${icon ? _esc(icon) + ' ' : ''}${_esc(String(num))}</span>
        <span style="display:block;font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">${_esc(txt)}</span>
    </div>`;
}

// renderStatGrid · grid responsive de stat cards
// args · { stats: [{ num, label, color?, icon?, title? }], cols? }
export function renderStatGrid({ stats = [], cols = 'auto-fit' } = {}) {
    if (!Array.isArray(stats) || stats.length === 0) return '';
    const inner = stats.map(s => renderStatCard(s)).join('');
    const tmpl = cols === 'auto-fit' ? 'repeat(auto-fit,minmax(140px,1fr))' : ('repeat(' + cols + ',1fr)');
    return `<div style="display:grid;grid-template-columns:${tmpl};gap:8px;">${inner}</div>`;
}

// renderEmptyState · paper buit amb icon + title + tagline + opcional CTA
// args · { icon?, title, tagline?, ctaLabel?, ctaHref?, copyKey? }
//   copyKey · si dóna · usa label(copyKey) per a title (DRY amb sosCopy)
export function renderEmptyState({ icon = '·', title = '', tagline = '', ctaLabel = null, ctaHref = null, copyKey = null } = {}) {
    const tt = copyKey ? label(copyKey, title) : title;
    const cta = (ctaLabel && ctaHref)
        ? `<a href="${_esc(ctaHref)}" data-link style="display:inline-block;margin-top:0.8rem;padding:8px 14px;background:${TOKENS.colors.primary};color:#fff;text-decoration:none;border-radius:${TOKENS.radii.md};font-size:0.82rem;font-weight:600;">${_esc(ctaLabel)}</a>`
        : '';
    return `<div style="text-align:center;padding:2.2rem 1rem;color:var(--text-muted);border:1px dashed var(--border-default);border-radius:${TOKENS.radii.lg};">
        <div style="font-size:2rem;margin-bottom:0.6rem;">${_esc(icon)}</div>
        <div style="font-size:0.95rem;color:var(--text-secondary);font-weight:600;">${_esc(tt)}</div>
        ${tagline ? `<div style="font-size:0.82rem;color:var(--text-muted);margin-top:0.4rem;line-height:1.5;max-width:480px;margin-left:auto;margin-right:auto;">${_esc(tagline)}</div>` : ''}
        ${cta}
    </div>`;
}

// renderProgressBar · barra progress KISS · gradient color per defecte
// args · { percent (0-100), color?, height?, gradient? }
export function renderProgressBar({ percent = 0, color = TOKENS.colors.primary, height = 8, gradient = null } = {}) {
    const pct = Math.max(0, Math.min(100, Number(percent) || 0));
    const fill = gradient || ('linear-gradient(90deg, ' + color + ', ' + TOKENS.colors.success + ')');
    return `<div style="height:${height}px;background:#0008;border-radius:${TOKENS.radii.sm};overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:${fill};transition:width 0.4s ease;"></div>
    </div>`;
}

// renderBadge · variant compacte de chip · icona destacada · per status pills
// args · { label, color, icon?, terminal? }
export function renderBadge({ label: text = '', color = TOKENS.colors.primary, icon = null, terminal = false } = {}) {
    const dot = terminal ? '' : `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${color};margin-right:4px;animation:sos-badge-pulse 1.4s infinite ease-in-out;"></span>`;
    return `<span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:${TOKENS.radii.pill};background:${color}25;color:${color};font-size:10px;font-weight:700;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:0.04em;">${dot}${icon ? _esc(icon) + ' ' : ''}${_esc(text)}</span>`;
}

// renderCard · card genèric amb header + body + opcional footer
// args · { title, icon?, color?, bodyHtml, footerHtml?, href? }
export function renderCard({ title = '', icon = null, color = TOKENS.colors.primary, bodyHtml = '', footerHtml = '', href = null } = {}) {
    const tag = href ? 'a' : 'div';
    const hrefAttr = href ? ` href="${_esc(href)}" data-link` : '';
    const linkStyle = href ? 'text-decoration:none;color:inherit;display:block;' : '';
    return `<${tag}${hrefAttr} style="background:var(--bg-panel);border:1px solid var(--border-default);border-left:3px solid ${color};border-radius:${TOKENS.radii.lg};padding:1rem 1.2rem;${linkStyle}">
        <div style="font-size:0.9rem;font-weight:700;margin-bottom:0.4rem;">${icon ? _esc(icon) + ' ' : ''}${_esc(title)}</div>
        <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.5;">${bodyHtml}</div>
        ${footerHtml ? `<div style="margin-top:0.6rem;padding-top:0.6rem;border-top:1px solid var(--border-default);font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">${footerHtml}</div>` : ''}
    </${tag}>`;
}

// renderInfoBanner · banner inline · útil per a hints i avisos sense modal
// args · { icon, message, kind? (info|warn|err|ok) · default info }
export function renderInfoBanner({ icon = 'ℹ', message = '', kind = 'info' } = {}) {
    const colorMap = {
        info: TOKENS.colors.info,
        warn: TOKENS.colors.warning,
        err:  TOKENS.colors.danger,
        ok:   TOKENS.colors.success,
    };
    const c = colorMap[kind] || colorMap.info;
    return `<div style="padding:8px 12px;background:${c}15;border:1px solid ${c}40;border-radius:${TOKENS.radii.md};color:${c};font-size:0.82rem;display:flex;gap:8px;align-items:flex-start;line-height:1.5;">
        <span>${_esc(icon)}</span>
        <span style="flex:1;color:var(--text-main);">${_esc(message)}</span>
    </div>`;
}

// ensureBadgePulseCss · injecta keyframes una vegada per página · KISS
let _pulseInjected = false;
export function ensureBadgePulseCss() {
    if (_pulseInjected) return;
    try {
        const style = document.createElement('style');
        style.setAttribute('data-sos-badge-pulse', '1');
        style.textContent = `@keyframes sos-badge-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%      { opacity: 0.5; transform: scale(0.8); }
        }`;
        document.head.appendChild(style);
        _pulseInjected = true;
    } catch (_) { /* no DOM · ignore */ }
}
