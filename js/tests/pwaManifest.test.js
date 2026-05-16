// UX-LEGENDARY · PWA manifest validation · install-to-home
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(__dirname, '..', '..', 'manifest.webmanifest');
const INDEX_PATH = join(__dirname, '..', '..', 'index.html');
const SW_PATH = join(__dirname, '..', '..', 'sw.js');
const ICON_PATH = join(__dirname, '..', '..', 'icons', 'sos.svg');

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== UX-LEGENDARY · PWA manifest ===\n');

// Manifest fitxer existeix i parsa
let manifest;
try {
    const raw = readFileSync(MANIFEST_PATH, 'utf8');
    manifest = JSON.parse(raw);
    t(true, 'A · manifest.webmanifest parsa JSON');
} catch (e) {
    t(false, 'A · manifest read · ' + (e?.message || e));
    process.exit(1);
}

// Camps obligatoris PWA
t(typeof manifest.name === 'string',                     'A · name present');
t(typeof manifest.short_name === 'string',               'A · short_name present');
t(manifest.short_name.length <= 12,                      'A · short_name ≤ 12 chars (PWA spec)');
t(typeof manifest.start_url === 'string',                'A · start_url present');
t(typeof manifest.display === 'string',                  'A · display present');
t(['standalone', 'fullscreen', 'minimal-ui'].includes(manifest.display), 'A · display mode valid');
t(/^#[0-9a-fA-F]{6}$/.test(manifest.theme_color),       'A · theme_color hex');
t(/^#[0-9a-fA-F]{6}$/.test(manifest.background_color),   'A · background_color hex');
t(Array.isArray(manifest.icons) && manifest.icons.length >= 1, 'A · ≥1 icon');

// Icons schema
for (const ico of manifest.icons) {
    t(typeof ico.src === 'string',                       'A · icon · src present');
    t(typeof ico.sizes === 'string',                     'A · icon · sizes present');
    t(typeof ico.type === 'string',                      'A · icon · type present');
}

// Shortcuts (recomanat per a launcher · android/iOS)
t(Array.isArray(manifest.shortcuts),                     'B · shortcuts array');
t(manifest.shortcuts.length >= 1,                        'B · ≥1 shortcut · install icon · long-press menu');
for (const sc of manifest.shortcuts) {
    t(sc.name && sc.url,                                 'B · shortcut · name + url');
}

// index.html · té tags PWA
let html;
try { html = readFileSync(INDEX_PATH, 'utf8'); } catch (e) { t(false, 'C · index.html · ' + e.message); }
t(html.includes('<link rel="manifest"'),                 'C · manifest link');
t(html.includes('theme-color'),                          'C · theme-color meta');
t(html.includes('apple-mobile-web-app-capable'),         'C · iOS install meta');
t(html.includes('apple-touch-icon'),                     'C · apple-touch-icon');
t(html.includes('serviceWorker.register'),               'C · SW registration script');

// SW exists
let sw;
try { sw = readFileSync(SW_PATH, 'utf8'); } catch (e) { t(false, 'D · sw.js · ' + e.message); }
t(sw.includes('install'),                                'D · install handler');
t(sw.includes('activate'),                               'D · activate handler');
t(sw.includes('fetch'),                                  'D · fetch handler');
t(sw.includes('CACHE_NAME'),                             'D · CACHE_NAME defined');

// Icon SVG present
let svg;
try { svg = readFileSync(ICON_PATH, 'utf8'); } catch (e) { t(false, 'E · sos.svg · ' + e.message); }
t(svg.includes('<svg'),                                  'E · sos.svg is SVG');
t(svg.includes('viewBox'),                               'E · viewBox present');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
