// V2-EVOL Fase B · tests de la migració completa Settings V1 → V2
// Veure `docs/STUDY-v2-evolution-plan-2026-05-16.md` Fase B.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEGACY_REDIRECTS } from '../core/routerRedirects.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== V2-EVOL Fase B · Settings migration ===\n');

const read = (rel) => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(REPO_ROOT, rel));

// ─── A · SettingsView V1 esborrat ────────────────────────────────────────
t(!exists('js/views/SettingsView.js'),                   'A · SettingsView.js V1 esborrat del repo');

// ─── B · /settings-v2 ara és redirect a /settings ────────────────────────
eq(LEGACY_REDIRECTS['/settings-v2'], '/settings',        'B · /settings-v2 → /settings redirect');

// ─── C · router carrega V2 a /settings ──────────────────────────────────
const router = read('js/router.js');
t(/path:\s*'\/settings'\s*,[^}]*SettingsV2View/.test(router), 'C · /settings carrega SettingsV2View');
t(!/path:\s*'\/settings-v2'/.test(router),               'C · /settings-v2 eliminat del ROUTES (gestionat per LEGACY_REDIRECTS)');
t(!/SettingsView\.js/.test(router),                      'C · router no importa SettingsView.js V1');

// ─── D · SettingsV2View té els 7 tabs ───────────────────────────────────
const v2 = read('js/views/SettingsV2View.js');
const expectedTabs = ['api-keys', 'theme', 'ai-defaults', 'payments', 'permaweb', 'manifesto', 'backup'];
for (const tabId of expectedTabs) {
    t(v2.includes('data-tab="' + tabId + '"'),           'D · tab "' + tabId + '" present');
}

// ─── E · features migrades de V1 ────────────────────────────────────────
// E1 · Stripe
t(v2.includes('SOS_PLANS'),                              'E · Stripe · SOS_PLANS importat');
t(v2.includes('saveStripeConfig'),                       'E · Stripe · saveStripeConfig importat');
t(v2.includes('loadStripeConfig'),                       'E · Stripe · loadStripeConfig importat');
t(v2.includes('validatePublishableKey'),                 'E · Stripe · validatePublishableKey importat');
t(v2.includes('detectKeyType'),                          'E · Stripe · detectKeyType (refusa sk_/rk_)');
t(v2.includes('openTopupPaymentLink'),                   'E · Stripe · openTopupPaymentLink importat');

// E2 · Plan
t(v2.includes('setCurrentPlan'),                         'E · Plan · setCurrentPlan importat');
t(v2.includes('loadCurrentPlan'),                        'E · Plan · loadCurrentPlan importat');
t(v2.includes('VALID_PLAN_IDS'),                         'E · Plan · VALID_PLAN_IDS importat');

// E3 · Manifesto
t(v2.includes('saveManifesto'),                          'E · Manifesto · saveManifesto importat');
t(v2.includes('loadManifesto'),                          'E · Manifesto · loadManifesto importat');
t(v2.includes('restoreDefaultManifesto'),                'E · Manifesto · restoreDefaultManifesto importat');
t(v2.includes('SOS_MANIFESTO'),                          'E · Manifesto · default constant importat');

// E4 · Export/Import real
t(v2.includes('downloadSnapshotJson'),                   'E · Backup · downloadSnapshotJson (no més redirect a /settings)');
t(v2.includes('readSnapshotFromFile'),                   'E · Backup · readSnapshotFromFile importat');
t(v2.includes('importSnapshot'),                         'E · Backup · importSnapshot importat');
t(!v2.includes("'/settings#export'"),                    'E · Backup · cap redirect a /settings#export');
t(!v2.includes("'/settings#import'"),                    'E · Backup · cap redirect a /settings#import');

// ─── F · bindings · accions des dels nous panels ─────────────────────────
t(v2.includes('data-action="save-stripe"'),              'F · binding save-stripe');
t(v2.includes('data-action="save-plan"'),                'F · binding save-plan');
t(v2.includes('data-action="save-manifesto"'),           'F · binding save-manifesto');
t(v2.includes('data-action="restore-manifesto"'),        'F · binding restore-manifesto');
t(v2.includes('data-action="open-topup"'),               'F · binding open-topup per a Payment Links');
t(v2.includes('data-action="export-snapshot"'),          'F · binding export-snapshot');
t(v2.includes('data-action="import-snapshot"'),          'F · binding import-snapshot');

// ─── G · cap referència orfena a SettingsView.js ────────────────────────
function recurseFiles(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === 'build' || entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...recurseFiles(full));
        else if (entry.name.endsWith('.js') || entry.name.endsWith('.json')) out.push(full);
    }
    return out;
}
const allFiles = recurseFiles(path.join(REPO_ROOT, 'js')).filter(f => !f.includes('/tests/'));
let orphanRefs = 0;
for (const f of allFiles) {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes("from '../views/SettingsView.js'") ||
        content.includes("import './views/SettingsView.js'") ||
        content.includes("'./views/SettingsView.js'")) {
        orphanRefs++;
        console.error('  ✘ orphan ref to SettingsView.js a ' + f);
    }
}
eq(orphanRefs, 0,                                        'G · cap import de SettingsView.js V1 al codebase');

// ─── H · sense /settings-v2 hardcoded a la nav ──────────────────────────
const navFiles = [
    'js/views/DashboardV2View.js',
    'js/core/mobileTopbar.js',
    'js/core/mobileBottomNav.js',
    'js/core/globalSearch.js',
];
for (const f of navFiles) {
    const c = read(f);
    // Excepció · routerRedirects pot mantenir la referència com a key/value del map
    t(!c.includes("'/settings-v2'") || f.includes('routerRedirects'),
      'H · ' + f.split('/').pop() + ' sense /settings-v2 hardcoded');
}

// ─── I · V2 té canonical badge · cap "Legacy V2 link" ───────────────────
t(v2.includes('renderCanonicalBadge'),                   'I · V2 mostra badge canonical');
t(!v2.includes('Legacy (pendent de migrar)'),            'I · cap back-link a Legacy V1');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
