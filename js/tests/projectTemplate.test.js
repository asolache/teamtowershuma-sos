// C2-TEMPLATES-001 sprint A · tests
import {
    SIMPLIFIED_TYPES, STAGE_GROUPS, PROJECT_TEMPLATES,
    simplifyType, simplifyStage,
    getTemplate, listTemplates,
    buildTemplateAwarePrompt,
    listSimplifiedTypes, listStageGroups,
    TEMPLATE_VERSION,
} from '../core/projectTemplateService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== C2-TEMPLATES-001 sprint A · projectTemplateService ===\n');

// 1 · Constants
t(typeof TEMPLATE_VERSION === 'string',                  'A · version');
eq(Object.keys(SIMPLIFIED_TYPES).length, 5,              'A · 5 simplified types');
eq(Object.keys(STAGE_GROUPS).length, 3,                  'A · 3 stage groups');
eq(Object.keys(PROJECT_TEMPLATES).length, 15,            'A · 15 plantilles (5×3)');

// 2 · Cada plantilla té shape complet
for (const [key, tpl] of Object.entries(PROJECT_TEMPLATES)) {
    t(tpl.canvasFocus,                                   'B · ' + key + ' · canvasFocus');
    t(tpl.pitchTone,                                     'B · ' + key + ' · pitchTone');
    t(tpl.valueFlowEmphasis,                             'B · ' + key + ' · valueFlowEmphasis');
    t(Array.isArray(tpl.roleSuggestions),                'B · ' + key + ' · roleSuggestions array');
    t(Array.isArray(tpl.sopFocus),                       'B · ' + key + ' · sopFocus array');
    t(Array.isArray(tpl.critical_kpis),                  'B · ' + key + ' · critical_kpis array');
}

// 3 · simplifyType mapping
eq(simplifyType('cooperativa-multi'), 'coop',            'C · cooperativa-multi → coop');
eq(simplifyType('cooperativa-cures'), 'coop',            'C · cures → coop');
eq(simplifyType('plataforma-cooperativa'), 'platform',   'C · platform coop → platform');
eq(simplifyType('dao-web3'), 'platform',                 'C · DAO → platform');
eq(simplifyType('comunitat-autosuficient'), 'commons',   'C · comunitat → commons');
eq(simplifyType('fundacio-ong'), 'commons',              'C · fundacio → commons');
eq(simplifyType('hub-transicio'), 'transition-hub',      'C · hub → transition-hub');
eq(simplifyType('espai-autogestionat'), 'service',       'C · espai → service');
eq(simplifyType('inventat-no-existeix'), 'service',      'C · unknown → service fallback');

// 4 · simplifyStage mapping
eq(simplifyStage('idea'), 'early',                       'D · idea → early');
eq(simplifyStage('mvp'), 'early',                        'D · mvp → early');
eq(simplifyStage('pilot'), 'early',                      'D · pilot → early');
eq(simplifyStage('growth'), 'scaling',                   'D · growth → scaling');
eq(simplifyStage('maturity'), 'consolidated',            'D · maturity → consolidated');
eq(simplifyStage('wind-down'), 'consolidated',           'D · wind-down → consolidated');
eq(simplifyStage('inventat'), 'early',                   'D · unknown → early fallback');

// 5 · getTemplate · happy path
const tpl1 = getTemplate({ projectType: 'cooperativa-multi', lifecycleStage: 'mvp' });
eq(tpl1.key, 'coop:early',                               'E · coop+mvp → coop:early');
t(tpl1.canvasFocus,                                      'E · canvasFocus present');

const tpl2 = getTemplate({ projectType: 'plataforma-cooperativa', lifecycleStage: 'growth' });
eq(tpl2.key, 'platform:scaling',                         'E · platform+growth → platform:scaling');

const tpl3 = getTemplate({ projectType: 'comunitat-autosuficient', lifecycleStage: 'maturity' });
eq(tpl3.key, 'commons:consolidated',                     'E · commons+maturity → commons:consolidated');

// 6 · Fallback amb type desconegut
const tplFb = getTemplate({ projectType: 'inventat', lifecycleStage: 'idea' });
eq(tplFb.key, 'service:early',                           'E · unknown type → service:early');

// 7 · listTemplates
const list = listTemplates();
eq(list.length, 15,                                      'F · 15 templates');
t(list.every(it => it.key && it.label),                  'F · all have key + label');

// 8 · listSimplifiedTypes / listStageGroups
eq(listSimplifiedTypes().length, 5,                      'F · 5 types listed');
eq(listStageGroups().length, 3,                          'F · 3 stages listed');

// 9 · buildTemplateAwarePrompt · canvas
const promptCanvas = buildTemplateAwarePrompt({
    templateKey: 'coop:early',
    stepKind: 'canvas',
    projectName: 'Test Coop',
    projectDescription: 'Test desc',
    sectorContext: 'tech',
});
t(promptCanvas.includes('coop'),                         'G · prompt mentions coop');
t(promptCanvas.includes('CANVAS FOCUS'),                 'G · canvas focus section');
t(promptCanvas.includes('Test Coop'),                    'G · project name in prompt');
t(promptCanvas.includes('value lens'),                   'G · value lens included');

// 10 · buildTemplateAwarePrompt · vna
const promptVna = buildTemplateAwarePrompt({
    templateKey: 'platform:scaling',
    stepKind: 'vna',
    projectName: 'Test Platform',
});
t(promptVna.includes('Roles suggerits'),                 'G · vna · roles suggested');
t(promptVna.includes('Transactions patterns'),           'G · vna · tx patterns');

// 11 · buildTemplateAwarePrompt · pitch
const promptPitch = buildTemplateAwarePrompt({
    templateKey: 'service:scaling',
    stepKind: 'pitch',
    projectName: 'Service Co',
});
t(promptPitch.includes('PITCH TONE'),                    'G · pitch tone present');
t(promptPitch.includes('KPIs crítiques'),                'G · kpis present');

// 12 · buildTemplateAwarePrompt · errors
try { buildTemplateAwarePrompt({ templateKey: 'inventat:early', stepKind: 'canvas' }); t(false, 'G · invalid key throws'); }
catch (_) { t(true, 'G · invalid key throws'); }

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
