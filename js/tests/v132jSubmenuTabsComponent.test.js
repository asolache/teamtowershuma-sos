// =============================================================================
// TEAMTOWERS SOS V11 — v132j · SubmenuTabs component · TDD
// Ruta · /js/tests/v132jSubmenuTabsComponent.test.js
//
// Verifica · component `js/ui/SubmenuTabs.js` (pattern canonical extret de
// LearnView · validat al mockup v132i). Test pur · sense DOM real · valida
// HTML output + URL helpers + edge cases.
// =============================================================================

import {
    SUBMENU_VERSION,
    renderSubmenuTabs,
    getActiveTabFromUrl,
    setActiveTabInUrl,
    bindSubmenuTabs,
    ensureSubmenuStyles,
    _resetSubmenuStylesForTest,
} from '../ui/SubmenuTabs.js';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v132j · SubmenuTabs · pattern canonical · TDD ===\n');

// ─── A · API surface ──────────────────────────────────────────────────
console.log('— A · API surface');
ok('A · SUBMENU_VERSION = v132j',                typeof SUBMENU_VERSION === 'string' && SUBMENU_VERSION === 'v132j');
ok('A · renderSubmenuTabs és funció',            typeof renderSubmenuTabs === 'function');
ok('A · bindSubmenuTabs és funció',              typeof bindSubmenuTabs === 'function');
ok('A · getActiveTabFromUrl és funció',          typeof getActiveTabFromUrl === 'function');
ok('A · setActiveTabInUrl és funció',            typeof setActiveTabInUrl === 'function');
ok('A · ensureSubmenuStyles és funció',          typeof ensureSubmenuStyles === 'function');

// ─── B · render · estructura HTML mínima ─────────────────────────────
console.log('\n— B · render · estructura mínima');
{
    const html = renderSubmenuTabs({ tabs: [
        { id: 'a', label: 'Apple', icon: '🍎' },
        { id: 'b', label: 'Banana', icon: '🍌' },
    ], activeId: 'a' });
    ok('B · wrapper <nav class="sos-submenu">',     html.includes('<nav class="sos-submenu"'));
    ok('B · wrapper role="tablist"',                 html.includes('role="tablist"'));
    ok('B · 2 botons .sos-submenu-tab',              (html.match(/<button class="sos-submenu-tab[ "]/g) || []).length === 2);
    ok('B · primera tab és active · is-active',      html.includes('data-submenu-tab="a"') && /class="sos-submenu-tab is-active"[^>]*data-submenu-tab="a"/.test(html));
    ok('B · activa té aria-current="page"',         /data-submenu-tab="a"[^>]*aria-current="page"/.test(html) ||
                                                     /aria-current="page"[^>]*data-submenu-tab="a"/.test(html));
    ok('B · icones renderitzades',                  html.includes('🍎') && html.includes('🍌'));
    ok('B · labels escapats',                       html.includes('Apple') && html.includes('Banana'));
    ok('B · data-url-param default · tab',          html.includes('data-url-param="tab"'));
}

// ─── C · render · dropdown ─────────────────────────────────────────────
console.log('\n— C · render · dropdown');
{
    const html = renderSubmenuTabs({
        tabs: [{ id: 'hub', label: 'Hub' }, { id: 'map', label: 'Map' }],
        dropdown: [
            { id: 'pacts',    label: 'Pactes',  icon: '📜' },
            { id: 'settings', label: 'Settings', icon: '⚙' },
        ],
        activeId: 'hub',
    });
    ok('C · wrapper .sos-submenu-dropdown-wrap',     html.includes('class="sos-submenu-dropdown-wrap"'));
    ok('C · botó .sos-submenu-dropdown-btn',         html.includes('class="sos-submenu-dropdown-btn"'));
    ok('C · aria-haspopup="true"',                   html.includes('aria-haspopup="true"'));
    ok('C · aria-expanded="false" (default tancat)', html.includes('aria-expanded="false"'));
    ok('C · panel .sos-submenu-dropdown-panel',      html.includes('class="sos-submenu-dropdown-panel"'));
    ok('C · panel role="menu"',                      html.includes('role="menu"'));
    ok('C · 2 items role="menuitem"',                (html.match(/role="menuitem"/g) || []).length === 2);
    ok('C · item Pactes amb data-submenu-tab',       html.includes('data-submenu-tab="pacts"') && html.includes('Pactes'));
    ok('C · text "Més ▾" present',                   html.includes('Més ▾'));
}

// ─── D · render · edge cases ──────────────────────────────────────────
console.log('\n— D · render · edge cases');
{
    ok('D · tabs buides → string buit',              renderSubmenuTabs({ tabs: [] }) === '');
    ok('D · tabs null → string buit',                renderSubmenuTabs({ tabs: null }) === '');
    ok('D · res params → string buit',               renderSubmenuTabs() === '');

    const html = renderSubmenuTabs({ tabs: [{ id: 'a', label: 'A' }] });
    ok('D · sense activeId · cap is-active',         !html.includes('is-active'));
    ok('D · sense icon · no <span> icon',             !html.includes('sos-submenu-tab-icon'));

    // XSS defense
    const dangerous = renderSubmenuTabs({ tabs: [{ id: '<script>', label: '<img onerror=x>' }] });
    ok('D · XSS · label escapat (no <img raw)',      !dangerous.includes('<img onerror=x>') && dangerous.includes('&lt;img'));
    ok('D · XSS · id escapat (no <script raw)',      !dangerous.match(/data-submenu-tab="<script>"/) && dangerous.includes('&lt;script&gt;'));

    // disabled flag
    const dis = renderSubmenuTabs({ tabs: [{ id: 'a', label: 'A', disabled: true }] });
    ok('D · disabled · attribute present',           dis.includes('disabled'));
}

// ─── E · render · custom urlParam ─────────────────────────────────────
console.log('\n— E · render · custom urlParam');
{
    const html = renderSubmenuTabs({
        tabs: [{ id: 'a', label: 'A' }],
        urlParam: 'view',
    });
    ok('E · data-url-param="view" propagated',       html.includes('data-url-param="view"'));
}

// ─── F · URL helpers · sense window (Node) ────────────────────────────
console.log('\n— F · URL helpers · safe sense window');
{
    // En Node · window és undefined · ha de retornar fallback
    ok('F · getActiveTabFromUrl(undef) → fallback',  getActiveTabFromUrl('tab', 'hub') === 'hub');
    ok('F · getActiveTabFromUrl(undef) sense fallback → null',
                                                     getActiveTabFromUrl('tab') === null);
    // setActiveTabInUrl · ha de no llançar
    let threw = false;
    try { setActiveTabInUrl('tab', 'map'); } catch (_) { threw = true; }
    ok('F · setActiveTabInUrl(no window) no llança', !threw);
}

// ─── G · URL helpers · amb window stub ────────────────────────────────
console.log('\n— G · URL helpers · amb window stub');
{
    const originalWindow = globalThis.window;
    globalThis.window = {
        location: { href: 'http://localhost/foo?tab=map&x=1', search: '?tab=map&x=1' },
        history: { replaceState: (state, t, url) => { globalThis.window.location.href = url; } },
    };
    ok('G · getActiveTabFromUrl lee · tab=map',      getActiveTabFromUrl('tab') === 'map');
    ok('G · getActiveTabFromUrl param inexistent → fallback',
                                                     getActiveTabFromUrl('other', 'fb') === 'fb');
    setActiveTabInUrl('tab', 'kanban');
    ok('G · setActiveTabInUrl · actualitza URL',     globalThis.window.location.href.includes('tab=kanban'));
    setActiveTabInUrl('tab', null);
    ok('G · setActiveTabInUrl(null) · elimina param', !globalThis.window.location.href.includes('tab='));
    globalThis.window = originalWindow;
}

// ─── H · bind · safe sense DOM ────────────────────────────────────────
console.log('\n— H · bind · safe sense DOM');
{
    const cleanup = bindSubmenuTabs('#nonexistent', () => {});
    ok('H · bind sense DOM retorna funció',          typeof cleanup === 'function');
    let threw = false;
    try { cleanup(); } catch (_) { threw = true; }
    ok('H · cleanup() no llança · idempotent',       !threw);

    const cleanup2 = bindSubmenuTabs(null, () => {});
    ok('H · bind(null) retorna funció (no error)',   typeof cleanup2 === 'function');
}

// ─── I · ensureSubmenuStyles · safe sense document ────────────────────
console.log('\n— I · ensureSubmenuStyles · safe sense document');
{
    _resetSubmenuStylesForTest();
    let threw = false;
    try { ensureSubmenuStyles(); } catch (_) { threw = true; }
    ok('I · ensureSubmenuStyles(no document) no llança', !threw);
}

// ─── J · CSS canonical · classes + vars present al source ─────────────
console.log('\n— J · CSS canonical · classes + vars');
{
    // Re-leim el fitxer per assertejar el contingut del style block
    const fs = await import('node:fs');
    const url = new URL('../ui/SubmenuTabs.js', import.meta.url);
    const src = fs.readFileSync(url, 'utf8');
    ok('J · CSS · .sos-submenu definit',             src.includes('.sos-submenu {'));
    ok('J · CSS · .sos-submenu-tab definit',         src.includes('.sos-submenu-tab {'));
    ok('J · CSS · .is-active definit',               src.includes('.sos-submenu-tab.is-active'));
    ok('J · CSS · :hover state',                     src.includes('.sos-submenu-tab:hover'));
    ok('J · CSS · :focus-visible (a11y)',            src.includes(':focus-visible'));
    ok('J · CSS · --sos-submenu-* vars usades',      src.includes('--sos-submenu-active-color') && src.includes('--sos-submenu-active-bg'));
    ok('J · CSS · fallbacks a tokens base',          src.includes('var(--accent-indigo, #6366f1)'));
}

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
