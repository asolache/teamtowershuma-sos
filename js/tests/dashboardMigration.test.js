// V2-EVOL Fase C · tests de la migració completa Dashboard V1 → V2
// Veure `docs/STUDY-v2-evolution-plan-2026-05-16.md` Fase C.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEGACY_REDIRECTS } from '../core/routerRedirects.js';
import { ONBOARDING_STEPS, computeOnboardingState, onboardingCompletion } from '../core/dashboardOnboardingService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== V2-EVOL Fase C · Dashboard migration ===\n');

const read = (rel) => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(REPO_ROOT, rel));

// ─── A · DashboardView V1 esborrat ──────────────────────────────────────
t(!exists('js/views/DashboardView.js'),                  'A · DashboardView.js V1 esborrat del repo');

// ─── B · /dashboard ara és redirect a /home ─────────────────────────────
eq(LEGACY_REDIRECTS['/dashboard'], '/home',              'B · /dashboard → /home redirect');

// ─── C · router elimina referència a DashboardView.js V1 ────────────────
const router = read('js/router.js');
t(!router.includes("DashboardView.js"),                  'C · router NO importa DashboardView.js V1');
t(/path:\s*'\/'\s*,[^}]*DashboardV2View/.test(router),   'C · / carrega DashboardV2View');
t(/path:\s*'\/home'\s*,[^}]*DashboardV2View/.test(router), 'C · /home carrega DashboardV2View');
t(!/path:\s*'\/dashboard'\s*,/.test(router),             'C · /dashboard eliminat del ROUTES');

// ─── D · DashboardV2View té les zones noves ─────────────────────────────
const v2 = read('js/views/DashboardV2View.js');
t(v2.includes('_zoneOnboarding'),                        'D · zoneOnboarding present');
t(v2.includes('_zoneMember'),                            'D · zoneMember present');

// ─── E · features migrades · imports ────────────────────────────────────
t(v2.includes('ONBOARDING_STEPS'),                       'E · ONBOARDING_STEPS importat');
t(v2.includes('computeOnboardingState'),                 'E · computeOnboardingState importat');
t(v2.includes('onboardingCompletion'),                   'E · onboardingCompletion importat');
t(v2.includes('nextOnboardingStep'),                     'E · nextOnboardingStep importat');
t(v2.includes('resolveCurrentMember'),                   'E · resolveCurrentMember importat');
t(v2.includes('summarizeMemberIdentity'),                'E · summarizeMemberIdentity importat');
t(v2.includes('computeMemberImpact'),                    'E · computeMemberImpact importat');
t(v2.includes('AVAILABILITY_META'),                      'E · AVAILABILITY_META importat');

// ─── F · estils CSS migrats ─────────────────────────────────────────────
t(v2.includes('.h2-onb-bar'),                            'F · CSS .h2-onb-bar (progress)');
t(v2.includes('.h2-onb-grid'),                           'F · CSS .h2-onb-grid');
t(v2.includes('.h2-onb-tile'),                           'F · CSS .h2-onb-tile');
t(v2.includes('.h2-onb-tile.done'),                      'F · CSS .h2-onb-tile.done · estat completat');
t(v2.includes('.h2-onb-tile.next'),                      'F · CSS .h2-onb-tile.next · estat next');
t(v2.includes('.h2-member-stats'),                       'F · CSS .h2-member-stats');
t(v2.includes('.h2-member-pill'),                        'F · CSS .h2-member-pill');

// ─── G · onboarding hide-when-complete ──────────────────────────────────
t(v2.includes('onboardingPct >= 100'),                   'G · onboarding ocult quan 100%');

// ─── H · cap reference orfena a DashboardView V1 ────────────────────────
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
    // No volem `DashboardView.js` (V1) com a import o referència directa al fitxer.
    // Sí volem `DashboardV2View.js` · els excloem amb la regex.
    if (/from\s+['"][^'"]*\bDashboardView\.js['"]/.test(content) ||
        /import\s+['"][^'"]*\bDashboardView\.js['"]/.test(content)) {
        orphanRefs++;
        console.error('  ✘ orphan ref to DashboardView.js a ' + f);
    }
}
eq(orphanRefs, 0,                                        'H · cap import de DashboardView.js V1 al codebase');

// ─── I · nav refs actualitzades · /home en lloc de /dashboard ───────────
const navFiles = [
    { f: 'js/core/mobileTopbar.js',    okKey: '/home' },
    { f: 'js/core/mobileBottomNav.js', okKey: '/home' },
    { f: 'js/core/navService.js',      okKey: '/home' },
];
for (const { f, okKey } of navFiles) {
    const c = read(f);
    // Cap href: '/dashboard' (literal · com link de nav)
    const hardcoded = /href:\s*['"]\/dashboard['"]/.test(c)
        || /'\/dashboard'\s*[,)\]]/.test(c)
        || /'\/dashboard'\s*$/.test(c);
    t(!hardcoded,                                         'I · ' + f.split('/').pop() + ' sense /dashboard hardcoded · usa ' + okKey);
}

// ─── J · onboarding service · integration sanity ────────────────────────
const state0 = computeOnboardingState({ identityNode: null, projects: [], qualityById: {} });
const pct0 = onboardingCompletion(state0).pct;
t(typeof pct0 === 'number' && pct0 >= 0 && pct0 <= 100, 'J · onboardingCompletion · pct vàlid');
eq(ONBOARDING_STEPS.length, 5,                          'J · ONBOARDING_STEPS · 5 passes');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
