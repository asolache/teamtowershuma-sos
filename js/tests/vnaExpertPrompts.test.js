// VNA-EXPERT-PROMPTS-001 · tests del sistema de prompts 3 capes
// Veure `docs/STUDY-value-flow-audit-2026-05-15.md` §5.

import {
    PROMPTS_VERSION, SYSTEM_BASE, FEW_SHOT_EXAMPLES, TASK_KINDS,
    buildPrompt, flattenPrompt, listTasks,
} from '../core/vnaExpertPrompts.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== VNA-EXPERT-PROMPTS-001 ===\n');

// ─── A · capa 1 · SYSTEM_BASE ─────────────────────────────────────────────
eq(PROMPTS_VERSION, 'v1.0',                              'A · version v1.0');
t(typeof SYSTEM_BASE === 'string' && SYSTEM_BASE.length > 500, 'A · SYSTEM_BASE no buit (>500 chars)');
t(/Value Network Analysis|VNA/.test(SYSTEM_BASE),       'A · menció explícita VNA · Value Network Analysis');
t(SYSTEM_BASE.includes('Value Network Analysis'),       'A · menció explícita VNA');
t(/Lean|TIMWOOD/.test(SYSTEM_BASE),                     'A · marc Lean');
t(SYSTEM_BASE.includes('SOC'),                          'A · concept SOC');
t(SYSTEM_BASE.includes('SOP'),                          'A · concept SOP');
t(/tangible/i.test(SYSTEM_BASE) && /intangible/i.test(SYSTEM_BASE), 'A · valor dual');
t(SYSTEM_BASE.includes('JSON estricte'),                'A · contracte JSON estricte');
t(/lead_time_hours/.test(SYSTEM_BASE),                  'A · mètriques Lean específiques');
t(/cicle recíproc/.test(SYSTEM_BASE),                   'A · regla cicle recíproc');
t(/orfe/.test(SYSTEM_BASE),                             'A · regla cap rol orfe');

// ─── B · capa 2 · FEW_SHOT_EXAMPLES ──────────────────────────────────────
eq(Object.keys(FEW_SHOT_EXAMPLES).length, 2,            'B · 2 templates al MVP (founder + default)');
t('founder-coop-tradicional' in FEW_SHOT_EXAMPLES,      'B · founder present');
t('default-balanced' in FEW_SHOT_EXAMPLES,              'B · default-balanced present');

for (const [id, ex] of Object.entries(FEW_SHOT_EXAMPLES)) {
    t(typeof ex.userPrompt === 'string' && ex.userPrompt.length > 30, 'B · ' + id + ' userPrompt ben format');
    t(typeof ex.assistantOutput === 'string',                          'B · ' + id + ' assistantOutput és string');
    // L'assistantOutput és JSON parseable
    let parsed = null;
    try { parsed = JSON.parse(ex.assistantOutput); } catch (_) { /* fall through */ }
    t(parsed && typeof parsed === 'object',                            'B · ' + id + ' assistantOutput és JSON vàlid');
    t(Array.isArray(parsed.roles) && parsed.roles.length >= 3,         'B · ' + id + ' ≥3 roles');
    t(Array.isArray(parsed.transactions) && parsed.transactions.length >= 5, 'B · ' + id + ' ≥5 transactions');
    t(parsed.transactions.some(tx => typeof tx.lead_time_hours === 'number'), 'B · ' + id + ' transactions amb lead_time');
    t(parsed.sops && parsed.sops.length >= 1,                          'B · ' + id + ' ≥1 SOP');
    t(parsed.socs && parsed.socs.length >= 1,                          'B · ' + id + ' ≥1 SOC');
}

// ─── C · capa 3 · TASK_KINDS + buildPrompt ───────────────────────────────
t(Array.isArray(TASK_KINDS) && TASK_KINDS.length >= 4,  'C · ≥4 task kinds');
t(TASK_KINDS.includes('enrich-value-map'),              'C · enrich-value-map present');
t(TASK_KINDS.includes('personalize-canvas'),            'C · personalize-canvas');
t(TASK_KINDS.includes('personalize-pitch'),             'C · personalize-pitch');
t(TASK_KINDS.includes('expand-sop'),                    'C · expand-sop');
t(TASK_KINDS.includes('generate-soc'),                  'C · generate-soc');

// ─── D · buildPrompt · happy paths ───────────────────────────────────────
{
    const p = buildPrompt({
        templateId: 'founder-coop-tradicional',
        taskKind:   'enrich-value-map',
        context:    { name: 'Castellers Bcn', sector: 'cultura', description: 'connectar colles', currentTemplate: { roles: [{ id: 'x' }] } },
    });
    eq(p.version, 'v1.0',                                'D · version');
    eq(p.system, SYSTEM_BASE,                            'D · system base passat');
    eq(p.fewShot.length, 2,                              'D · few-shot · 2 messages (user+assistant)');
    eq(p.fewShot[0].role, 'user',                        'D · few-shot[0] role user');
    eq(p.fewShot[1].role, 'assistant',                   'D · few-shot[1] role assistant');
    t(p.user.includes('Castellers Bcn'),                'D · context aplicat al user prompt');
    t(p.user.includes('cultura'),                        'D · sector al user prompt');
    t(typeof p.approxTokens === 'number' && p.approxTokens > 0, 'D · approxTokens calculat');
}

// ─── E · buildPrompt · skip few-shot quan templateId null ────────────────
{
    const p = buildPrompt({ taskKind: 'personalize-canvas', context: { name: 'X', description: 'd' } });
    eq(p.fewShot.length, 0,                              'E · sense templateId · cap few-shot');
    t(p.user.length > 0,                                 'E · user prompt encara generat');
}

// ─── F · buildPrompt · templateId inexistent · ignora gracios ────────────
{
    const p = buildPrompt({ templateId: 'unknown-x', taskKind: 'personalize-pitch', context: { name: 'X', description: 'd' } });
    eq(p.fewShot.length, 0,                              'F · templateId desconegut · sense few-shot · sense petar');
}

// ─── G · buildPrompt · taskKind invàlid · throws ─────────────────────────
{
    let threw = false;
    try { buildPrompt({ taskKind: 'invalid-task' }); } catch (_) { threw = true; }
    t(threw,                                             'G · taskKind invàlid · throws');
}

// ─── H · token budget · approxTokens < 2500 per a typical prompts ────────
{
    const p = buildPrompt({
        templateId: 'founder-coop-tradicional',
        taskKind:   'enrich-value-map',
        context:    { name: 'Castellers Bcn', sector: 'cultura', description: 'connectar colles', currentTemplate: null },
    });
    t(p.approxTokens < 2500,                             'H · token budget · ' + p.approxTokens + ' < 2500');
}
{
    // Worst case · template gegant
    const bigTemplate = { roles: new Array(20).fill({ id: 'r', kind: 'pm', name: 'Role' }), transactions: new Array(40).fill({ id: 't', from: 'a', to: 'b', deliverable: 'd' }), deliverables: [], sops: [] };
    const p = buildPrompt({ templateId: 'founder-coop-tradicional', taskKind: 'enrich-value-map', context: { name: 'X', description: 'y', currentTemplate: bigTemplate } });
    t(p.approxTokens < 3500,                             'H · worst-case template gegant · approxTokens ' + p.approxTokens + ' < 3500');
}

// ─── I · per cada taskKind · prompt no buit ──────────────────────────────
for (const tk of TASK_KINDS) {
    const ctx = {
        name: 'Test', description: 'd', sector: 'x',
        roleName: 'r', sopTitle: 's', deliverable: 'd',
        currentTemplate: null, sops: [{ id: 'sop-1', role_ref: 'r', title: 't' }],
    };
    const p = buildPrompt({ taskKind: tk, context: ctx });
    t(p.user && p.user.length >= 50,                     'I · ' + tk + ' · user prompt mínim 50 chars (got ' + p.user.length + ')');
}

// ─── J · flattenPrompt · serialització lineal ────────────────────────────
{
    const p = buildPrompt({ templateId: 'founder-coop-tradicional', taskKind: 'personalize-pitch', context: { name: 'X', description: 'y' } });
    const flat = flattenPrompt(p);
    t(typeof flat === 'string',                          'J · flatten retorna string');
    t(flat.includes('[USER]'),                           'J · separadors per role');
    t(flat.includes('[ASSISTANT]'),                      'J · assistant inclos');
    t(flat.length > p.system.length,                     'J · flatten cobreix system+few-shot+user');
}

// ─── K · listTasks · utilitat per UI ─────────────────────────────────────
{
    const list = listTasks();
    t(Array.isArray(list),                               'K · listTasks array');
    eq(list.length, TASK_KINDS.length,                   'K · listTasks · mateixa mida');
    // Cap mutation
    list.push('hacked');
    eq(TASK_KINDS.length, list.length - 1,               'K · listTasks retorna còpia · TASK_KINDS no mutated');
}

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
