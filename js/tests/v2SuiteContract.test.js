// TDD-V2-SUITE · contracte de totes les vistes V2 oficials abans d'alfa
// Veure WO `wo-tdd-v2-suite-001` al backlog.
//
// Estratègia · tests de CONTRACTE sense DOM ni IndexedDB · inspecciona
// el fitxer font per garantir l'estructura mínima requerida + smoke parse
// per validar sintaxi. Per a tests d'integració completa amb DOM real ·
// caldria Playwright/Puppeteer (futur · post-alfa).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

const read = (rel) => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');

console.log('\n=== TDD-V2-SUITE · contracte vistes V2 oficials ===\n');

// ─── A · DashboardV2View ───────────────────────────────────────────────
{
    const f = read('js/views/DashboardV2View.js');
    t(/export default class DashboardV2View/.test(f),    'A · DashboardV2View · classe default exportada');
    t(/async getHtml\s*\(/.test(f),                       'A · getHtml async');
    t(/async afterRender\s*\(/.test(f),                   'A · afterRender async');
    t(f.includes('_zone1_Hero'),                          'A · zone 1 · Hero');
    t(f.includes('_zoneOnboarding'),                      'A · zone Onboarding (V2-EVOL Fase C)');
    t(f.includes('_zoneMember'),                          'A · zone Member identity (V2-EVOL Fase C)');
    t(f.includes('_zone2_Projects'),                      'A · zone 2 · Projects');
    t(f.includes('_zone3_Activity'),                      'A · zone 3 · Activity feed');
    t(f.includes('_zone4_QuickLinks'),                    'A · zone 4 · Quick links');
    t(f.includes('buildFeed'),                            'A · buildFeed importat (activity feed unificat)');
    t(f.includes('computeOnboardingState'),               'A · computeOnboardingState (V1 features migrades)');
    t(f.includes('resolveCurrentMember'),                 'A · resolveCurrentMember (member identity)');
    t(f.includes('onboardingPct >= 100'),                 'A · onboarding hide-when-complete');
    t(/['"]\/me['"]/.test(f),                             'A · profile link a /me (profile-360)');
    t(/href:\s*['"]\/notes['"]/.test(f),                  'A · notes link present');
}

// ─── B · SettingsV2View · 7 tabs canonical ─────────────────────────────
{
    const f = read('js/views/SettingsV2View.js');
    t(/export default class SettingsV2View/.test(f),     'B · SettingsV2View · classe default exportada');
    t(/async getHtml\s*\(/.test(f),                       'B · getHtml async');
    const tabs = ['api-keys', 'theme', 'ai-defaults', 'payments', 'permaweb', 'manifesto', 'backup'];
    for (const tab of tabs) {
        t(f.includes('data-tab="' + tab + '"'),           'B · tab "' + tab + '" present');
    }
    // 7 tabs, no més no menys (legacy V1 eliminat)
    const tabMatches = f.match(/data-tab="[a-z-]+"/g) || [];
    eq(tabMatches.length, 7,                              'B · exactament 7 tabs');
    // V2-EVOL features migrades
    t(f.includes('SOS_PLANS'),                            'B · Stripe Plans (Fase B-2)');
    t(f.includes('saveStripeConfig'),                     'B · Stripe save (Fase B-2)');
    t(f.includes('saveManifesto'),                        'B · Manifesto save (Fase B-2)');
    t(f.includes('downloadSnapshotJson'),                 'B · Export real (Fase B-2)');
    t(f.includes('readSnapshotFromFile'),                 'B · Import real (Fase B-2)');
    t(!f.includes("'/settings#export'"),                  'B · cap redirect a /settings#export (resolt)');
    t(f.includes('renderCanonicalBadge'),                 'B · canonical badge "V2 · oficial"');
}

// ─── C · ProjectHubV2View · 7 zones ───────────────────────────────────
{
    const f = read('js/views/ProjectHubV2View.js');
    t(/export default class ProjectHubV2View/.test(f),   'C · ProjectHubV2View · classe default exportada');
    t(/async getHtml\s*\(/.test(f),                       'C · getHtml async');
    // 7 zones esperades (segons doc plan v2)
    const zones = ['Hero', 'Topbar', 'Activity', 'Quality', 'Health', 'KPI', 'Suggest'];
    let found = 0;
    for (const z of zones) {
        if (f.toLowerCase().includes(z.toLowerCase())) found++;
    }
    t(found >= 5,                                          'C · ≥5 de 7 zones canòniques presents (found ' + found + ')');
    // Activity feed unificat
    t(f.includes('buildFeed') || f.includes('activityFeedService'), 'C · activity feed integrat');
}

// ─── D · Profile360View · 8 zones legendàries ─────────────────────────
{
    const f = read('js/views/Profile360View.js');
    t(/export default class Profile360View/.test(f),     'D · Profile360View · classe exportada');
    const zones = ['_zoneHero', '_zoneIkigai', '_zoneSkills', '_zoneKnowledge',
                   '_zoneReputation', '_zoneWork', '_zoneOfferings', '_zoneNetwork'];
    for (const z of zones) {
        t(f.includes(z),                                  'D · ' + z + ' present');
    }
    t(f.includes('buildProfile360'),                      'D · usa profile360Service');
    t(f.includes('ensureMember'),                         'D · auto-create matriu_member');
    t(/this\._handle\.toLowerCase\(\)|lcHandle/.test(f),  'D · case-insensitive handle (fix ikigai persistence)');
}

// ─── E · NotesView · captures FAB + evolve CTAs ───────────────────────
{
    const f = read('js/views/NotesView.js');
    t(/export default class NotesView/.test(f),          'E · NotesView · classe exportada');
    const captureTypes = ['note', 'wo', 'insight', 'skill'];
    for (const ct of captureTypes) {
        t(f.includes("id: '" + ct + "'") || f.includes('"id": "' + ct + '"'),  'E · capture type ' + ct + ' present');
    }
    t(f.includes('data-action="evolve-to"'),              'E · evolve CTAs · 3 targets');
    t(f.includes("data-target=\"project\""),              'E · evolve target project');
    t(f.includes("data-target=\"work_order\""),           'E · evolve target work_order');
    t(f.includes("data-target=\"deliverable\""),          'E · evolve target deliverable');
}

// ─── F · InboxView · sent invites · resol pain point @mazinguer ───────
{
    const f = read('js/views/InboxView.js');
    t(f.includes('listInvitesSent'),                      'F · listInvitesSent importat (sent invites)');
    t(f.includes('sentInvites'),                          'F · sentInvites computed');
    t(f.includes('_renderSentInviteCard'),                'F · _renderSentInviteCard mètode');
    t(f.includes('Invitacions enviades'),                 'F · UI · secció "Invitacions enviades"');
}

// ─── G · ProjectQualityView · rubric V2 + integrity V2 ─────────────────
{
    const f = read('js/views/ProjectQualityView.js');
    t(f.includes('evaluateRubric'),                       'G · evaluateRubric importat');
    t(f.includes('validateIntegrity'),                    'G · validateIntegrity importat');
    t(f.includes('fromProject'),                          'G · fromProject adapter');
    t(f.includes('_renderRubricV2'),                      'G · _renderRubricV2 mètode');
    t(f.includes('Rubric V2 · 12 criteris auditables'),   'G · UI · panell rubric V2');
}

// ─── H · ProjectCreationV2View · usa orchestrator (post-#121) ─────────
{
    const f = read('js/views/ProjectCreationV2View.js');
    t(f.includes('projectCreationOrchestrator'),          'H · orchestrator template-based importat');
    t(f.includes('createProject'),                        'H · createProject API');
    t(!f.includes('unifiedProjectCreationService'),       'H · cap dependència legacy unifiedProjectCreationService');
    t(f.includes('templateId'),                           'H · query param templateId');
    t(f.includes('skip-prompt'),                          'H · auto-submit per a deeplinks demo');
}

// ─── I · MIGRATION CONTRACT · cap V1 al codebase ───────────────────────
{
    // SettingsView · DashboardView · ProfileView · esborrats post V2-EVOL + profile-360
    const v1Views = [
        'js/views/SettingsView.js',
        'js/views/DashboardView.js',
        'js/views/ProfileView.js',
    ];
    for (const v of v1Views) {
        const full = path.join(REPO_ROOT, v);
        t(!fs.existsSync(full),                           'I · ' + v + ' esborrat (post-merge consolidació)');
    }
    // Router · cap import dels esborrats
    const router = read('js/router.js');
    for (const v of v1Views) {
        const basename = path.basename(v);
        t(!router.includes(basename),                     'I · router · cap import de ' + basename);
    }
    // Banners deprecation eliminats (V1 ja no existeixen)
    // Però el component DeprecatedBanner queda per a usos futurs
    t(fs.existsSync(path.join(REPO_ROOT, 'js/core/deprecatedBanner.js')), 'I · deprecatedBanner component conservat (per a futur V1→V2)');
}

// ─── J · ROUTER · /me i /u/{handle} · canonical V2 ──────────────────────
{
    const f = read('js/router.js');
    t(/path:\s*'\/me'/.test(f),                           'J · ruta /me registrada');
    t(/Profile360View/.test(f),                           'J · Profile360View consumeix /me i /u/{handle}');
    t(/path:\s*'\/notes'/.test(f),                        'J · ruta /notes registrada');
    t(/path:\s*'\/settings'/.test(f) && /SettingsV2View/.test(f), 'J · /settings = SettingsV2View canonical');
    t(/LEGACY_REDIRECTS/.test(f),                         'J · LEGACY_REDIRECTS importat');
    t(!/'\/dashboard'\s*,\s*view/.test(f),                'J · /dashboard NO té vista directa (redirect)');
}

// ─── K · LEGACY_REDIRECTS · contracte canonical ─────────────────────────
{
    const f = read('js/core/routerRedirects.js');
    const expectedRedirects = ['/team', '/paper', '/lms', '/focus', '/settings-v2', '/dashboard'];
    for (const r of expectedRedirects) {
        t(f.includes("'" + r + "'"),                      'K · redirect ' + r + ' present');
    }
    t(f.includes('resolveLegacyPath'),                    'K · resolveLegacyPath helper exportat');
}

// ─── L · TESTS HEALTH · suites del sprint legendary ─────────────────────
{
    const expectedSuites = [
        'projectCreationLegendary.test.js',
        'projectTemplateCatalog.test.js',
        'valueFlowRubric.test.js',
        'valueFlowIntegrityService.test.js',
        'vnaExpertPrompts.test.js',
        'projectCreationV2Url.test.js',
        'profile360Service.test.js',
        'ikigaiPersistenceRegression.test.js',
        'creationCompletenessGuarantee.test.js',
        'routerRedirects.test.js',
        'dashboardMigration.test.js',
        'settingsMigration.test.js',
        'kanbanSosBacklog.test.js',
        'agentBacklogLoader.test.js',
    ];
    for (const s of expectedSuites) {
        t(fs.existsSync(path.join(REPO_ROOT, 'js/tests', s)), 'L · suite ' + s + ' present');
    }
}

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
