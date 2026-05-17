// =============================================================================
// TEAMTOWERS SOS V11 — v146 · LLM local training · TDD
// Ruta · /js/tests/v146LlmLocalTraining.test.js
//
// Verifica · ollamaProvider (HTTP adapter local) + llmTrainingDataset (JSONL
// builder · 3 formats) + CLI export-training-dataset · tanca wo-llm-local-train.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
    OLLAMA_VERSION, SUGGESTED_MODELS,
    ollamaGenerate, ollamaListModels, ollamaHealthCheck, makeOllamaProvider,
} from '../core/ollamaProvider.js';
import {
    TRAINING_VERSION, SUPPORTED_FORMATS,
    buildDataset, serializeJsonl, sourceCounts,
} from '../core/llmTrainingDataset.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v146 · LLM local training · TDD ===\n');

// ═════════════════════════════════════════════════════════════════════
// PART A · ollamaProvider
// ═════════════════════════════════════════════════════════════════════
console.log('— A · ollamaProvider API');
ok('A · OLLAMA_VERSION = v146',                      OLLAMA_VERSION === 'v146');
ok('A · ollamaGenerate async function',              typeof ollamaGenerate === 'function');
ok('A · ollamaListModels async function',            typeof ollamaListModels === 'function');
ok('A · ollamaHealthCheck async function',           typeof ollamaHealthCheck === 'function');
ok('A · makeOllamaProvider factory',                 typeof makeOllamaProvider === 'function');
ok('A · SUGGESTED_MODELS · ≥ 5 models',              Array.isArray(SUGGESTED_MODELS) && SUGGESTED_MODELS.length >= 5);
ok('A · qwen2.5:3b suggerit (small + ràpid)',        SUGGESTED_MODELS.some(m => m.name === 'qwen2.5:3b'));
ok('A · suggested · ram_min_gb + use + hw fields',    SUGGESTED_MODELS.every(m => m.ram_min_gb && m.use && m.hw));

// ─── B · ollamaGenerate · mock fetch · success ────────────────────────
console.log('\n— B · ollamaGenerate · mock fetch');
{
    let capturedUrl = null, capturedBody = null;
    const mockFetch = async (url, opts) => {
        capturedUrl = url;
        capturedBody = JSON.parse(opts.body);
        return {
            ok: true, status: 200,
            json: async () => ({
                response: 'Bona resposta',
                prompt_eval_count: 12,
                eval_count: 8,
                done_reason: 'stop',
            }),
        };
    };
    const r = await ollamaGenerate({
        baseUrl: 'http://localhost:11434',
        model: 'qwen2.5:3b',
        systemPrompt: 'Ets un agent SOS.',
        userPrompt: 'Hola',
        fetchFn: mockFetch,
    });
    ok('B · URL · /api/generate',                    capturedUrl.endsWith('/api/generate'));
    ok('B · body · model + prompt + system + stream:false',
                                                      capturedBody.model === 'qwen2.5:3b' &&
                                                      capturedBody.prompt === 'Hola' &&
                                                      capturedBody.system === 'Ets un agent SOS.' &&
                                                      capturedBody.stream === false);
    ok('B · body · options.temperature + num_predict',capturedBody.options.temperature === 0.3 &&
                                                      capturedBody.options.num_predict === 1800);
    ok('B · response · text retornat',                r.text === 'Bona resposta');
    ok('B · usage · inputTokens + outputTokens',      r.usage.inputTokens === 12 && r.usage.outputTokens === 8);
    ok('B · modelKey · ollama/<model>',                r.modelKey === 'ollama/qwen2.5:3b');
}

// ─── C · ollamaGenerate · format=json injectat ────────────────────────
console.log('\n— C · ollamaGenerate · format JSON mode');
{
    let body;
    const mockFetch = async (_, opts) => {
        body = JSON.parse(opts.body);
        return { ok: true, json: async () => ({ response: '{}', prompt_eval_count: 5, eval_count: 2 }) };
    };
    await ollamaGenerate({ model: 'qwen2.5:3b', userPrompt: 'x', format: 'json', fetchFn: mockFetch });
    ok('C · format=json afegit al body',              body.format === 'json');
}

// ─── D · ollamaGenerate · errors ─────────────────────────────────────
console.log('\n— D · ollamaGenerate · errors');
{
    let threw = false;
    try { await ollamaGenerate({ userPrompt: '', fetchFn: async () => ({}) }); }
    catch (e) { threw = e.message.includes('userPrompt required'); }
    ok('D · sense userPrompt · throw',                 threw);

    let connErr = false;
    try {
        await ollamaGenerate({ userPrompt: 'x', fetchFn: async () => { throw new Error('ECONNREFUSED'); } });
    } catch (e) { connErr = e.message.includes('connection failed'); }
    ok('D · connection error · throw user-friendly',   connErr);

    let httpErr = false;
    try {
        await ollamaGenerate({ userPrompt: 'x', fetchFn: async () => ({ ok: false, status: 404, json: async () => ({ error: 'model not found' }) }) });
    } catch (e) { httpErr = e.message.includes('http 404') && e.message.includes('model not found'); }
    ok('D · http error · status + detail propagat',    httpErr);
}

// ─── E · ollamaListModels + ollamaHealthCheck ──────────────────────────
console.log('\n— E · ollamaListModels + ollamaHealthCheck');
{
    const mockTags = async () => ({
        ok: true,
        json: async () => ({ models: [
            { name: 'qwen2.5:3b', size: 1900000000, digest: 'abc' },
            { name: 'phi3:mini',  size: 2300000000, digest: 'def' },
        ]}),
    });
    const r = await ollamaListModels({ fetchFn: mockTags });
    ok('E · listModels · 2 models',                    r.ok === true && r.models.length === 2);
    ok('E · model · name + size + digest',             r.models[0].name === 'qwen2.5:3b' && r.models[0].size === 1900000000);

    const rFail = await ollamaListModels({ fetchFn: async () => { throw new Error('refused'); } });
    ok('E · listModels · connection fail · ok=false',  rFail.ok === false && rFail.error.includes('connection-failed'));

    const hc = await ollamaHealthCheck({ fetchFn: async () => ({ ok: true, text: async () => 'Ollama is running' }) });
    ok('E · healthCheck · ok=true',                    hc.ok === true);
    const hcFail = await ollamaHealthCheck({ fetchFn: async () => { throw new Error('boom'); } });
    ok('E · healthCheck · fail · user-friendly',       hcFail.ok === false && hcFail.error.includes('Ollama running'));
}

// ─── F · makeOllamaProvider · compatible amb harness signature ─────────
console.log('\n— F · makeOllamaProvider · provider signature');
{
    const mockFetch = async (_, opts) => ({
        ok: true,
        json: async () => ({ response: 'OK', prompt_eval_count: 10, eval_count: 5 }),
    });
    const provider = makeOllamaProvider({ defaultModel: 'qwen2.5:3b' });
    // Patch global fetch per al test · ollamaGenerate usa fetch global si no es passa fetchFn
    const origFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;
    try {
        const r = await provider('ignored-modelKey', { systemPrompt: 's', userPrompt: 'u' });
        ok('F · provider crida ollamaGenerate · text OK',  r.text === 'OK');
        ok('F · usage propagat correctament',              r.usage.inputTokens === 10 && r.usage.outputTokens === 5);
    } finally { globalThis.fetch = origFetch; }
}

// ═════════════════════════════════════════════════════════════════════
// PART G · llmTrainingDataset
// ═════════════════════════════════════════════════════════════════════
console.log('\n— G · llmTrainingDataset API');
ok('G · TRAINING_VERSION = v146',                    TRAINING_VERSION === 'v146');
ok('G · SUPPORTED_FORMATS · alpaca/chatml/sharegpt', SUPPORTED_FORMATS.includes('alpaca') &&
                                                      SUPPORTED_FORMATS.includes('chatml') &&
                                                      SUPPORTED_FORMATS.includes('sharegpt'));
ok('G · buildDataset async',                         typeof buildDataset === 'function');
ok('G · serializeJsonl + sourceCounts',              typeof serializeJsonl === 'function' && typeof sourceCounts === 'function');

// ─── H · KB mock · build dataset · alpaca format ───────────────────────
console.log('\n— H · buildDataset · alpaca format');
function makeMockKb() {
    const store = {
        skill: [
            { id: 's1', type: 'skill', content: { title: 'VNA · Verna Allee', description: 'Mapping de xarxa de valor amb 5 principis sagrats.' } },
            { id: 's2', type: 'skill', content: { title: 'Casteller model', description: '6 nivells castell · pom_de_dalt a baixos · usat per ordenar rols.' } },
        ],
        work_order: [
            { id: 'wo1', type: 'work_order', content: { title: 'Generate canvas', description: 'Genera canvas IKIGAI', status: 'done', role_ref: 'founder', plan: 'Buscar visió + missió + valors' } },
        ],
        value_map: [
            { id: 'vm1', type: 'value_map', content: {
                projectName: 'Forn Vall',
                roles: [{ id: 'r1', name: 'Founder', castell_level: 'pom_de_dalt' }, { id: 'r2', name: 'Customer', castell_level: 'baixos' }],
                transactions: [{ from: 'r1', to: 'r2', deliverable: 'Pa fresc' }],
            }},
        ],
        project_canvas: [
            { id: 'c1', type: 'project_canvas', content: { projectName: 'Forn Vall', vision: 'Pa de proximitat', mission: 'Cooperar', values: ['sostenibilitat'] } },
        ],
        project_pitch: [
            { id: 'p1', type: 'project_pitch', content: { projectName: 'Forn Vall', problem: 'Pa industrial', solution: 'Forn cooperatiu', why_now: 'Demanda creixent' } },
        ],
    };
    return {
        query: async (filter) => store[filter.type] || [],
    };
}

{
    const r = await buildDataset({ kb: makeMockKb(), format: 'alpaca', maxSamples: 100 });
    ok('H · ok=true',                                   r.ok === true);
    ok('H · samples · ≥ 5 (1 per source mínim)',         r.samples.length >= 5);
    ok('H · alpaca · cada sample té instruction + input + output',
                                                        r.samples.every(s => s.instruction && s.output));
    ok('H · stats.format = alpaca',                     r.stats.format === 'alpaca');
    ok('H · stats.bySource agrega · ≥ 5 sources',       Object.keys(r.stats.bySource).length >= 5);
    ok('H · skill sample · output inclou desc',         r.samples.find(s => s.source === 'skill')?.output.includes('xarxa de valor'));
    ok('H · value_map sample · output inclou castell',  r.samples.find(s => s.source === 'value_map')?.output.includes('pom_de_dalt'));
}

// ─── I · buildDataset · chatml format ──────────────────────────────────
console.log('\n— I · buildDataset · chatml format');
{
    const r = await buildDataset({ kb: makeMockKb(), format: 'chatml', maxSamples: 100 });
    ok('I · ok=true',                                   r.ok === true);
    ok('I · cada sample té messages[3] · system/user/assistant',
                                                        r.samples.every(s => Array.isArray(s.messages) && s.messages.length === 3 &&
                                                                              s.messages[0].role === 'system' &&
                                                                              s.messages[1].role === 'user' &&
                                                                              s.messages[2].role === 'assistant'));
    ok('I · system inclou persona SOS',                 r.samples[0].messages[0].content.includes('SOS V11') &&
                                                        r.samples[0].messages[0].content.includes('VNA'));
}

// ─── J · buildDataset · sharegpt format ────────────────────────────────
console.log('\n— J · buildDataset · sharegpt format');
{
    const r = await buildDataset({ kb: makeMockKb(), format: 'sharegpt', maxSamples: 100 });
    ok('J · ok=true',                                   r.ok === true);
    ok('J · cada sample · conversations[3] · system/human/gpt',
                                                        r.samples.every(s => Array.isArray(s.conversations) && s.conversations.length === 3));
    ok('J · roles · system/human/gpt',                  r.samples[0].conversations[0].from === 'system' &&
                                                        r.samples[0].conversations[1].from === 'human' &&
                                                        r.samples[0].conversations[2].from === 'gpt');
}

// ─── K · buildDataset · validacions + filters ──────────────────────────
console.log('\n— K · buildDataset · validacions + filters');
{
    const rBad = await buildDataset({ format: 'unknown' });
    ok('K · format invàlid · ok=false',                rBad.ok === false && rBad.error.includes('format-not-supported'));

    const rNoKb = await buildDataset({ kb: {} });   // KB sense query method
    ok('K · KB sense .query · kb-unavailable',        rNoKb.ok === false && rNoKb.error === 'kb-unavailable');

    const rNoWos = await buildDataset({ kb: makeMockKb(), includeWOs: false });
    ok('K · includeWOs=false · cap WO al dataset',     !Object.keys(rNoWos.stats.bySource).includes('work_order'));

    const rMax = await buildDataset({ kb: makeMockKb(), maxSamples: 2 });
    ok('K · maxSamples=2 · cap a 2',                    rMax.samples.length === 2);
}

// ─── L · serializeJsonl + sourceCounts pure ────────────────────────────
console.log('\n— L · serializeJsonl + sourceCounts');
{
    const samples = [
        { instruction: 'A', output: 'a', source: 'skill' },
        { instruction: 'B', output: 'b', source: 'work_order' },
        { instruction: 'C', output: 'c', source: 'skill' },
    ];
    const jsonl = serializeJsonl(samples);
    ok('L · serializeJsonl · 3 línies',                jsonl.split('\n').length === 3);
    ok('L · cada línia parseja JSON',                  jsonl.split('\n').every(l => JSON.parse(l)));

    const counts = sourceCounts(samples);
    ok('L · sourceCounts · skill=2 · work_order=1',    counts.skill === 2 && counts.work_order === 1);

    ok('L · serializeJsonl(empty) = ""',               serializeJsonl([]) === '');
}

// ═════════════════════════════════════════════════════════════════════
// PART M · CLI export-training-dataset
// ═════════════════════════════════════════════════════════════════════
console.log('\n— M · CLI export-training-dataset');
{
    const cliPath = path.join(ROOT, 'scripts/export-training-dataset.mjs');
    ok('M · CLI existeix',                              fs.existsSync(cliPath));

    // Test --help
    const help = spawnSync('node', [cliPath, '--help'], { cwd: ROOT, encoding: 'utf8', timeout: 5000 });
    ok('M · --help · exit 0',                          help.status === 0);
    ok('M · --help · format options',                  help.stdout.includes('alpaca') && help.stdout.includes('chatml') && help.stdout.includes('sharegpt'));
    ok('M · --help · --kb-file flag',                  help.stdout.includes('--kb-file'));

    // Test amb --kb-file mock
    const mockKb = {
        nodes: [
            { id: 's1', type: 'skill', content: { title: 'VNA', description: 'Verna Allee mapping de xarxa de valor.' } },
            { id: 's2', type: 'skill', content: { title: 'Casteller', description: '6 nivells castell.' } },
        ],
    };
    const tmpKb = path.join(ROOT, 'docs/training/test-kb-mock.json');
    fs.mkdirSync(path.dirname(tmpKb), { recursive: true });
    fs.writeFileSync(tmpKb, JSON.stringify(mockKb), 'utf8');
    const tmpOut = path.join(ROOT, 'docs/training/test-out.jsonl');

    const run = spawnSync('node', [cliPath, '--kb-file', tmpKb, '--format', 'alpaca', '--out', tmpOut],
        { cwd: ROOT, encoding: 'utf8', timeout: 10000 });
    ok('M · CLI run · exit 0',                          run.status === 0);
    ok('M · stdout · "Total samples · 2"',              run.stdout.includes('Total samples · 2'));
    ok('M · fitxer JSONL escrit',                       fs.existsSync(tmpOut));
    ok('M · fitxer meta companion escrit',              fs.existsSync(tmpOut + '.meta.json'));
    if (fs.existsSync(tmpOut)) {
        const lines = fs.readFileSync(tmpOut, 'utf8').split('\n').filter(Boolean);
        ok('M · 2 línies JSONL',                       lines.length === 2);
        ok('M · cada línia parseja',                    lines.every(l => JSON.parse(l).instruction));
    }
    // Cleanup
    try { fs.unlinkSync(tmpKb); fs.unlinkSync(tmpOut); fs.unlinkSync(tmpOut + '.meta.json'); } catch (_) {}
}

// ═════════════════════════════════════════════════════════════════════
// PART N · Doc · llm-local-training.md
// ═════════════════════════════════════════════════════════════════════
console.log('\n— N · Doc llm-local-training');
const docPath = path.join(ROOT, 'docs/llm-local-training.md');
ok('N · doc existeix',                                 fs.existsSync(docPath));
const doc = fs.readFileSync(docPath, 'utf8');
ok('N · 3 capes documentades · Inference · Few-shot · Fine-tune',
                                                       doc.includes('Inference local') && doc.includes('Few-shot context') && doc.includes('Fine-tune real'));
ok('N · Mac 2012 limitations',                        doc.includes('Mac 2012') && doc.includes('GPU') && doc.includes('cloud'));
ok('N · Ollama instal·lació + models suggerits',     doc.includes('brew install ollama') && doc.includes('qwen2.5:3b'));
ok('N · cloud GPU options (Together · Modal · RunPod · HF)',
                                                       doc.includes('Together AI') && doc.includes('Modal') && doc.includes('RunPod') && doc.includes('HuggingFace'));
ok('N · CLI export-training-dataset documentat',      doc.includes('scripts/export-training-dataset.mjs'));
ok('N · privacy + leakage section',                    doc.includes('Privacy') && doc.includes('leakage'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
