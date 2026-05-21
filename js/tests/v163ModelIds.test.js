// =============================================================================
// SOS V11 · v163.5 · model IDs match real API conventions (regression test)
//
// CONTEXT · v163.4 i abans tenien IDs deepseek-v3 i deepseek-r1 que no existen
// a l'API de Deepseek (correctes · deepseek-chat / deepseek-reasoner) ·
// provocaven HTTP 400 a tot el fluxe SOC/SOP/WO durant creació de mapa de valor.
// Tamb tenien claude-haiku-4-5 sense date suffix · 400 a l'evaluator.
//
// Aquest test fixa aquestes correspondències perquè cap regressió torni a
// trencar el fluxe LLM-driven.
// =============================================================================

import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v163.5 · model IDs match real API conventions ===\n');

const { AI_MODELS, TASK_ROUTING } = await import(path.join(ROOT, 'js/core/aiRouterService.js'));

// ─── A · Deepseek · IDs API reals ──────────────────────────────────────
console.log('— A · Deepseek · API correct IDs');
ok('A · deepseek/v3 id = deepseek-chat',                AI_MODELS['deepseek/v3'].id === 'deepseek-chat');
ok('A · deepseek/r1 id = deepseek-reasoner',             AI_MODELS['deepseek/r1'].id === 'deepseek-reasoner');
ok('A · NO usem deepseek-v3 (inexistent a l\'API)',     AI_MODELS['deepseek/v3'].id !== 'deepseek-v3');
ok('A · NO usem deepseek-r1 (inexistent a l\'API)',     AI_MODELS['deepseek/r1'].id !== 'deepseek-r1');

// ─── B · Anthropic · format model IDs ──────────────────────────────────
console.log('\n— B · Anthropic · format IDs');
const opus    = AI_MODELS['anthropic/opus-4.7'].id;
const sonnet  = AI_MODELS['anthropic/sonnet-4.6'].id;
const haiku   = AI_MODELS['anthropic/haiku-4.5'].id;
ok('B · opus id comença per claude-opus',                opus.startsWith('claude-opus'));
ok('B · sonnet id comença per claude-sonnet',            sonnet.startsWith('claude-sonnet'));
ok('B · haiku id comença per claude-haiku',              haiku.startsWith('claude-haiku'));
// Haiku 4.5 té dated suffix (verificat al system prompt actual)
ok('B · haiku 4.5 té date suffix (claude-haiku-4-5-20251001)',
   haiku === 'claude-haiku-4-5-20251001');

// ─── C · OpenAI / Gemini · sanity check ───────────────────────────────
console.log('\n— C · OpenAI / Gemini');
ok('C · gpt-5 id = gpt-5',                               AI_MODELS['openai/gpt-5'].id === 'gpt-5');
ok('C · gpt-4o id = gpt-4o',                              AI_MODELS['openai/gpt-4o'].id === 'gpt-4o');
ok('C · gemini-2.5-flash id correcte',                   AI_MODELS['gemini/2.5-flash'].id === 'gemini-2.5-flash');

// ─── D · TASK_ROUTING · cadenes válides (tots els models existeixen) ──
console.log('\n— D · TASK_ROUTING · tots els modelKey existeixen');
for (const [taskKind, route] of Object.entries(TASK_ROUTING)) {
    const refs = [route.primary, route.fallback, route.premium, route.evaluator].filter(Boolean);
    for (const ref of refs) {
        ok('D · ' + taskKind + ' · ' + ref + ' existeix a AI_MODELS', !!AI_MODELS[ref]);
    }
}

// ─── E · adapter guards · userPrompt buit · source-level check ────────
console.log('\n— E · adapter guards · empty userPrompt (source-level)');
const fs = await import('node:fs');
const src = fs.readFileSync(path.join(ROOT, 'js/core/aiProviderService.js'), 'utf8');
ok('E · anthropic adapter té guard userPrompt buit',
   /anthropic[\s\S]{0,400}empty userPrompt/i.test(src));
ok('E · deepseek adapter té guard userPrompt buit',
   /deepseek[\s\S]{0,400}empty userPrompt/i.test(src));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
