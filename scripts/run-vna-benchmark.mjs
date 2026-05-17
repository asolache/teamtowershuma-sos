#!/usr/bin/env node
// =============================================================================
// TEAMTOWERS SOS V11 — v132f+g+h · BENCHMARK RUNNER CLI · VNA A/B (FULL vs SLIM)
// Ruta · /scripts/run-vna-benchmark.mjs
//
// Executa els 20 casos canonical de `knowledge/benchmarks/vna-quality-cases.json`
// amb LLM real i omple una taula markdown amb tokens · score · winner per
// omplir el doc `docs/PROMPT-EFFICIENCY-LESSONS.md`.
//
// v132g+h · MULTI-PROVIDER · 5 providers suportats · executa contra N en una
// sola tirada i compara quin dóna millor qualitat/cost (cross-provider verdict).
//
// Providers · anthropic · openai · gemini · deepseek · minimax (v132h)
// Env vars · ANTHROPIC_API_KEY · OPENAI_API_KEY · GEMINI_API_KEY (o GOOGLE_API_KEY)
//           · DEEPSEEK_API_KEY · MINIMAX_API_KEY
//
// Ús ·
//   ANTHROPIC_API_KEY=... node scripts/run-vna-benchmark.mjs                                  # single (default anthropic)
//   ANTHROPIC_API_KEY=... OPENAI_API_KEY=... node scripts/run-vna-benchmark.mjs --providers anthropic,openai
//   <5 api keys>=... node scripts/run-vna-benchmark.mjs --providers anthropic,openai,gemini,deepseek,minimax
//   node scripts/run-vna-benchmark.mjs --dry-run --providers anthropic,openai,deepseek      # smoke test
//   node scripts/run-vna-benchmark.mjs --limit 3                                              # 3 casos
//   node scripts/run-vna-benchmark.mjs --model claude-sonnet-4-6                              # override model
//
// Sortida · imprimeix resum + escriu a docs/benchmarks/results-<ts>-multi.md.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runABTest, summarizeABTests } from '../js/core/promptABTestService.js';
// v145 · quality harness mode
import { runQualityHarness, compareWithBaseline, serializeBaseline, loadBaselineFromText, DEFAULT_THRESHOLDS } from '../js/core/promptQualityHarness.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── CLI args parsing ───────────────────────────────────────────────────────
function parseArgs(argv) {
    const args = { cases: null, limit: null, dryRun: false, providers: null, provider: 'anthropic', model: null, outDir: 'docs/benchmarks',
                   harness: false, baseline: null, updateBaseline: false, slim: true };
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--cases')          args.cases    = argv[++i];
        else if (a === '--limit')     args.limit    = parseInt(argv[++i], 10);
        else if (a === '--providers') args.providers= argv[++i];
        else if (a === '--provider')  args.provider = argv[++i];
        else if (a === '--model')     args.model    = argv[++i];
        else if (a === '--out')       args.outDir   = argv[++i];
        else if (a === '--dry-run')   args.dryRun   = true;
        // v145 · harness mode · runs quality + compares baseline
        else if (a === '--harness')   args.harness  = true;
        else if (a === '--baseline')  args.baseline = argv[++i];
        else if (a === '--update-baseline') args.updateBaseline = true;
        else if (a === '--no-slim')   args.slim     = false;
        else if (a === '--help' || a === '-h') {
            console.log('Usage · node scripts/run-vna-benchmark.mjs [options]');
            console.log('  --providers anthropic,openai,gemini,deepseek,minimax  · csv de providers');
            console.log('  --cases <path>           · benchmark cases JSON · default knowledge/benchmarks/vna-quality-cases.json');
            console.log('  --limit <n>              · primers N casos');
            console.log('  --model <id>             · model override');
            console.log('  --dry-run                · sense LLM');
            console.log('  --harness                · quality harness · runs current prompt + scores + compares baseline');
            console.log('  --baseline <path>        · baseline JSON path · default docs/benchmarks/baseline.json');
            console.log('  --update-baseline        · escriu el run actual com a nou baseline');
            console.log('  --no-slim                · usa SYSTEM_BASE FULL (default SLIM)');
            process.exit(0);
        }
    }
    // Normalitza · --providers csv > --provider single > default anthropic
    if (args.providers) {
        args.providerList = args.providers.split(',').map(s => s.trim()).filter(Boolean);
    } else {
        args.providerList = [args.provider];
    }
    return args;
}

// ── Provider adapters (minimal · env-key based · CLI-only) ────────────────
async function makeProvider(name, modelOverride) {
    if (name === 'anthropic') {
        const key = process.env.ANTHROPIC_API_KEY;
        if (!key) throw new Error('ANTHROPIC_API_KEY no configurada · exporta-la abans d\'executar');
        const model = modelOverride || 'claude-haiku-4-5-20251001';
        return async (_modelKey, opts) => {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
                body: JSON.stringify({
                    model,
                    max_tokens:  opts.maxOutputTokens || 1800,
                    temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.3,
                    system:      opts.systemPrompt || '',
                    messages: [{ role: 'user', content: opts.userPrompt || '' }],
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error('anthropic ' + res.status + ' · ' + (data?.error?.message || res.statusText));
            const text = (data?.content || []).map(b => b?.text || '').join('');
            return { text, usage: { inputTokens: data?.usage?.input_tokens || 0, outputTokens: data?.usage?.output_tokens || 0 } };
        };
    }
    if (name === 'openai') {
        const key = process.env.OPENAI_API_KEY;
        if (!key) throw new Error('OPENAI_API_KEY no configurada');
        const model = modelOverride || 'gpt-4o-mini';
        return async (_modelKey, opts) => {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
                body: JSON.stringify({
                    model,
                    max_tokens:  opts.maxOutputTokens || 1800,
                    temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.3,
                    messages: [
                        { role: 'system', content: opts.systemPrompt || '' },
                        { role: 'user',   content: opts.userPrompt   || '' },
                    ],
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error('openai ' + res.status + ' · ' + (data?.error?.message || res.statusText));
            return {
                text: data?.choices?.[0]?.message?.content || '',
                usage: { inputTokens: data?.usage?.prompt_tokens || 0, outputTokens: data?.usage?.completion_tokens || 0 },
            };
        };
    }
    if (name === 'gemini') {
        const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!key) throw new Error('GEMINI_API_KEY (o GOOGLE_API_KEY) no configurada');
        const model = modelOverride || 'gemini-2.0-flash-exp';
        return async (_modelKey, opts) => {
            const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: opts.systemPrompt ? { parts: [{ text: opts.systemPrompt }] } : undefined,
                    contents: [{ role: 'user', parts: [{ text: opts.userPrompt || '' }] }],
                    generationConfig: {
                        temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.3,
                        maxOutputTokens: opts.maxOutputTokens || 1800,
                    },
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error('gemini ' + res.status + ' · ' + (data?.error?.message || res.statusText));
            const text = (data?.candidates?.[0]?.content?.parts || []).map(p => p?.text || '').join('');
            return { text, usage: {
                inputTokens:  data?.usageMetadata?.promptTokenCount     || 0,
                outputTokens: data?.usageMetadata?.candidatesTokenCount || 0,
            }};
        };
    }
    if (name === 'deepseek') {
        const key = process.env.DEEPSEEK_API_KEY;
        if (!key) throw new Error('DEEPSEEK_API_KEY no configurada');
        const model = modelOverride || 'deepseek-chat';
        return async (_modelKey, opts) => {
            const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
                body: JSON.stringify({
                    model,
                    max_tokens:  opts.maxOutputTokens || 1800,
                    temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.3,
                    messages: [
                        { role: 'system', content: opts.systemPrompt || '' },
                        { role: 'user',   content: opts.userPrompt   || '' },
                    ],
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error('deepseek ' + res.status + ' · ' + (data?.error?.message || res.statusText));
            return {
                text: data?.choices?.[0]?.message?.content || '',
                usage: { inputTokens: data?.usage?.prompt_tokens || 0, outputTokens: data?.usage?.completion_tokens || 0 },
            };
        };
    }
    if (name === 'minimax') {
        const key = process.env.MINIMAX_API_KEY;
        if (!key) throw new Error('MINIMAX_API_KEY no configurada');
        const model = modelOverride || 'MiniMax-Text-01';
        return async (_modelKey, opts) => {
            const res = await fetch('https://api.minimaxi.com/v1/text/chatcompletion_v2', {
                method: 'POST',
                headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
                body: JSON.stringify({
                    model,
                    max_tokens:  opts.maxOutputTokens || 1800,
                    temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.3,
                    messages: [
                        { role: 'system', content: opts.systemPrompt || '' },
                        { role: 'user',   content: opts.userPrompt   || '' },
                    ],
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error('minimax ' + res.status + ' · ' + (data?.base_resp?.status_msg || data?.error?.message || res.statusText));
            return {
                text: data?.choices?.[0]?.message?.content || '',
                usage: { inputTokens: data?.usage?.prompt_tokens || data?.usage?.total_tokens || 0, outputTokens: data?.usage?.completion_tokens || 0 },
            };
        };
    }
    throw new Error('provider desconegut · ' + name + ' · disponibles · anthropic · openai · gemini · deepseek · minimax');
}

// ── Render markdown summary · single provider (legacy compat) ────────────
function renderMarkdown(results, meta) {
    const lines = [];
    lines.push('# VNA Benchmark Results · v132f');
    lines.push('');
    lines.push('· Generated · ' + new Date().toISOString());
    lines.push('· Provider · ' + meta.provider + (meta.model ? ' · model ' + meta.model : ''));
    lines.push('· Cases · ' + results.length + (meta.limit ? ' (limit ' + meta.limit + ')' : ''));
    lines.push('');
    lines.push('## Casos · resultats');
    lines.push('');
    lines.push('| Cas | Winner | Score A (FULL) | Score B (SLIM) | Tokens A | Tokens B | Saving | Note |');
    lines.push('|---|---|---:|---:|---:|---:|---:|---|');
    for (const r of results) {
        const a = r.result?.variants?.A;
        const b = r.result?.variants?.B;
        const winner = r.result?.comparison?.winner ?? '—';
        const sA = a?.score?.score ?? '—';
        const sB = b?.score?.score ?? '—';
        const tA = a?.approxTokens ?? '—';
        const tB = b?.approxTokens ?? '—';
        const saving = (typeof tA === 'number' && typeof tB === 'number' && tA > 0)
            ? (((tA - tB) / tA) * 100).toFixed(0) + '%' : '—';
        const note = r.error ? '⚠ ' + r.error.slice(0, 60) : '';
        lines.push('| ' + r.id + ' | ' + winner + ' | ' + sA + ' | ' + sB + ' | ' + tA + ' | ' + tB + ' | ' + saving + ' | ' + note + ' |');
    }
    const okResults = results.filter(r => r.result && !r.error).map(r => ({ content: {
        winner: r.result.comparison?.winner, deltaScore: r.result.comparison?.deltaScore,
        scoreA: r.result.variants?.A?.score, scoreB: r.result.variants?.B?.score,
        tokensA: r.result.variants?.A?.approxTokens, tokensB: r.result.variants?.B?.approxTokens,
        usageA: r.result.variants?.A?.usage, usageB: r.result.variants?.B?.usage,
    }}));
    const sum = summarizeABTests(okResults);
    lines.push('');
    lines.push('## Resum agregat');
    lines.push('');
    lines.push('· Total mostres · ' + sum.total);
    lines.push('· Wins A (FULL) · ' + sum.winner.A);
    lines.push('· Wins B (SLIM) · ' + sum.winner.B);
    lines.push('· Empats · ' + sum.winner.tie);
    lines.push('· Score mitjà A · ' + sum.avgScoreA);
    lines.push('· Score mitjà B · ' + sum.avgScoreB);
    lines.push('· Win rate A · ' + sum.winRateA + '%');
    lines.push('· Win rate B · ' + sum.winRateB + '%');
    lines.push('· Avg tokens A · ' + sum.avgTokensA);
    lines.push('· Avg tokens B · ' + sum.avgTokensB);
    lines.push('· Token savings B · ' + sum.tokenSavingsB + '%');
    lines.push('');
    lines.push('## Hipòtesi H1 · "Menys context > més context"');
    lines.push('');
    if (sum.total === 0) {
        lines.push('— **INDETERMINAT** · mostres insuficients');
    } else if (sum.winRateB >= 60) {
        lines.push('✓ **CONFIRMAT** · Win rate B = ' + sum.winRateB + '% ≥ 60% · activar `slim:true` per defecte a v133+');
    } else {
        lines.push('✗ **REBUTJAT** · Win rate B = ' + sum.winRateB + '% < 60% · mantenir FULL com a default · refinar SLIM');
    }
    return lines.join('\n');
}

// ── Render markdown · multi-provider matrix (v132g) ──────────────────────
function renderMarkdownMulti(perProvider, meta) {
    const lines = [];
    lines.push('# VNA Benchmark Results · v132g · MULTI-PROVIDER');
    lines.push('');
    lines.push('· Generated · ' + new Date().toISOString());
    lines.push('· Providers · ' + meta.providers.join(', '));
    lines.push('· Cases · ' + meta.totalCases + (meta.limit ? ' (limit ' + meta.limit + ')' : ''));
    lines.push('· Mode · ' + (meta.dryRun ? 'DRY-RUN' : 'LIVE'));
    lines.push('');

    // Index per id de cas · per facilitar render de matriu
    const caseIds = meta.caseIds;

    // ─── Matriu casos × providers ──────────────────────────────────────────
    lines.push('## Matriu casos × providers · winner (A=FULL · B=SLIM · tie)');
    lines.push('');
    const headerWinner = '| Cas | ' + meta.providers.join(' | ') + ' |';
    lines.push(headerWinner);
    lines.push('|' + Array(meta.providers.length + 1).fill('---').join('|') + '|');
    for (const id of caseIds) {
        const cells = [id];
        for (const p of meta.providers) {
            const r = perProvider[p]?.find(x => x.id === id);
            cells.push(r?.error ? '⚠' : (r?.result?.comparison?.winner || '—'));
        }
        lines.push('| ' + cells.join(' | ') + ' |');
    }
    lines.push('');

    // ─── Matriu casos × providers · scores A / B ───────────────────────────
    lines.push('## Matriu casos × providers · scores (FULL/SLIM)');
    lines.push('');
    lines.push(headerWinner);
    lines.push('|' + Array(meta.providers.length + 1).fill('---').join('|') + '|');
    for (const id of caseIds) {
        const cells = [id];
        for (const p of meta.providers) {
            const r = perProvider[p]?.find(x => x.id === id);
            if (r?.error) cells.push('⚠');
            else {
                const sA = r?.result?.variants?.A?.score?.score ?? '—';
                const sB = r?.result?.variants?.B?.score?.score ?? '—';
                cells.push(sA + ' / ' + sB);
            }
        }
        lines.push('| ' + cells.join(' | ') + ' |');
    }
    lines.push('');

    // ─── Resum agregat per provider ────────────────────────────────────────
    lines.push('## Resum agregat per provider');
    lines.push('');
    lines.push('| Provider | Total | Wins A (FULL) | Wins B (SLIM) | Ties | Avg score A | Avg score B | Win rate B | Avg tokens A | Avg tokens B | Token saving B | Hipòtesi H1 |');
    lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|');
    const summaries = {};
    for (const p of meta.providers) {
        const results = perProvider[p] || [];
        const okResults = results.filter(r => r.result && !r.error).map(r => ({ content: {
            winner: r.result.comparison?.winner, deltaScore: r.result.comparison?.deltaScore,
            scoreA: r.result.variants?.A?.score, scoreB: r.result.variants?.B?.score,
            tokensA: r.result.variants?.A?.approxTokens, tokensB: r.result.variants?.B?.approxTokens,
            usageA: r.result.variants?.A?.usage, usageB: r.result.variants?.B?.usage,
        }}));
        const sum = summarizeABTests(okResults);
        summaries[p] = sum;
        const h1 = sum.total === 0 ? '— indet.'
            : sum.winRateB >= 60 ? '✓ CONFIRMAT (' + sum.winRateB + '%)'
            : '✗ rebutjat (' + sum.winRateB + '%)';
        lines.push('| ' + p + ' | ' + sum.total + ' | ' + sum.winner.A + ' | ' + sum.winner.B + ' | ' + sum.winner.tie + ' | ' +
            sum.avgScoreA + ' | ' + sum.avgScoreB + ' | ' + sum.winRateB + '% | ' +
            sum.avgTokensA + ' | ' + sum.avgTokensB + ' | ' + sum.tokenSavingsB + '% | ' + h1 + ' |');
    }
    lines.push('');

    // ─── Cross-provider analysis ──────────────────────────────────────────
    lines.push('## Anàlisi cross-provider · decisió slim default per-provider?');
    lines.push('');
    const winRates = meta.providers.map(p => summaries[p]?.winRateB ?? 0);
    const minWR = Math.min(...winRates);
    const maxWR = Math.max(...winRates);
    const spread = maxWR - minWR;
    lines.push('· Win rate B mínim · ' + minWR + '% (' + meta.providers[winRates.indexOf(minWR)] + ')');
    lines.push('· Win rate B màxim · ' + maxWR + '% (' + meta.providers[winRates.indexOf(maxWR)] + ')');
    lines.push('· Spread · ' + spread + ' punts');
    lines.push('');
    if (meta.providers.length < 2) {
        lines.push('— Només 1 provider · sense comparativa cross-provider possible.');
    } else if (spread >= 20) {
        lines.push('⚠ **DIVERGÈNCIA SIGNIFICATIVA** · spread ≥ 20 punts · el default `slim` hauria de ser **per-provider** (no global). Algun provider funciona molt millor amb FULL que amb SLIM.');
    } else if (maxWR >= 60 && minWR >= 60) {
        lines.push('✓ **CONSENS** · tots els providers confirmen H1 (≥ 60%) · activar `slim:true` globalment com a default.');
    } else if (maxWR < 60) {
        lines.push('✗ **CONSENS NEGATIU** · cap provider confirma H1 · mantenir FULL com a default global · refinar SLIM.');
    } else {
        lines.push('— **MIXT** · uns confirmen, altres no, però spread baix · usar mitjana o votació majoritària.');
    }
    return lines.join('\n');
}

// ── Dry-run provider · retorna JSON sintètic per smoke test ──────────────
const dryRunProvider = async () => ({ text: JSON.stringify({
    roles: [{ id: 'r1' }, { id: 'r2' }], transactions: [{ from: 'r1', to: 'r2' }], deliverables: [],
}), usage: { inputTokens: 100, outputTokens: 50 } });

async function runOneProvider(name, providerFn, cases) {
    const results = [];
    for (let i = 0; i < cases.length; i++) {
        const c = cases[i];
        const tag = '[' + name + ' · ' + (i + 1) + '/' + cases.length + '] ' + c.id;
        process.stdout.write(tag + ' · ');
        try {
            const r = await runABTest({
                context: { name: c.name, description: c.description, sector: c.sector, vna_zoom: 'mid' },
                provider: providerFn,
            });
            const w = r.comparison?.winner || '—';
            const sA = r.variants?.A?.score?.score ?? '—';
            const sB = r.variants?.B?.score?.score ?? '—';
            console.log('winner=' + w + ' · A=' + sA + ' · B=' + sB + ' · ' + r.ms + 'ms');
            results.push({ id: c.id, result: r });
        } catch (e) {
            console.log('✗ ' + e.message);
            results.push({ id: c.id, error: e.message });
        }
    }
    return results;
}

// ── Harness mode · v145 · quality tracking amb baseline comparison ──────
async function runHarnessMode(args, cases) {
    const providerName = args.providerList[0];
    console.log('=== VNA Harness · v145 · QUALITY TRACKING ===');
    console.log('· Cases · ' + cases.length);
    console.log('· Provider · ' + providerName + (args.model ? ' · ' + args.model : ''));
    console.log('· Variant · ' + (args.slim ? 'SLIM (default)' : 'FULL'));
    console.log('· Mode · ' + (args.dryRun ? 'DRY-RUN' : 'LIVE'));
    console.log('');

    let providerFn;
    if (args.dryRun) {
        providerFn = dryRunProvider;
    } else {
        try { providerFn = await makeProvider(providerName, args.model); }
        catch (e) { console.error('✗ provider · ' + e.message); process.exit(1); }
    }

    const t0 = Date.now();
    const run = await runQualityHarness({
        cases, provider: providerFn, slim: args.slim,
        onProgress: ({ idx, total, result }) => {
            const tag = '[' + idx + '/' + total + '] ' + result.id;
            if (result.ok) console.log(tag + ' · ok · score=' + result.score + ' · tokens=' + result.tokens + ' · €' + result.costEur + ' · ' + result.ms + 'ms');
            else            console.log(tag + ' · ✗ ' + result.error);
        },
    });
    if (!run.ok) { console.error('✗ harness · ' + run.error); process.exit(1); }
    const ag = run.aggregate;
    console.log('');
    console.log('═══ AGGREGATE ═══');
    console.log('· ok · ' + ag.ok + '/' + ag.total);
    console.log('· avgScore · ' + ag.avgScore);
    console.log('· passRate · ' + (ag.passRate * 100).toFixed(0) + '% (cases score ≥ ' + DEFAULT_THRESHOLDS.passScore + ')');
    console.log('· avgTokens · ' + ag.avgTokens);
    console.log('· avgCostEur · €' + ag.avgCostEur);
    console.log('· totalCostEur · €' + ag.totalCostEur);
    console.log('· runtime · ' + (Date.now() - t0) + 'ms');
    console.log('');

    const baselinePath = args.baseline || path.join(ROOT, 'docs/benchmarks/baseline.json');
    let baseline = null;
    if (fs.existsSync(baselinePath)) {
        try {
            const text = fs.readFileSync(baselinePath, 'utf8');
            const parsed = loadBaselineFromText(text);
            if (parsed.ok) baseline = parsed.baseline;
            else console.warn('⚠ baseline existeix però invàlid · ' + parsed.error);
        } catch (e) { console.warn('⚠ no es pot llegir baseline · ' + e.message); }
    }

    if (baseline) {
        const cmp = compareWithBaseline({ current: run, baseline });
        if (cmp.ok) {
            console.log('═══ COMPARACIÓ vs BASELINE (' + baseline.timestamp.slice(0, 10) + ') ═══');
            console.log('· Δscore · ' + (cmp.deltaScore >= 0 ? '+' : '') + cmp.deltaScore + 'pp');
            console.log('· Δcost · ' + (cmp.deltaCost >= 0 ? '+' : '') + cmp.deltaCost + '%');
            console.log('· Δtokens · ' + (cmp.deltaTokens >= 0 ? '+' : '') + cmp.deltaTokens);
            console.log('· ΔpassRate · ' + (cmp.deltaPassRate >= 0 ? '+' : '') + cmp.deltaPassRate + 'pp');
            console.log('· Verdict · ' + cmp.recommendation);
            console.log('');
            if (cmp.regression) {
                console.error('🛑 REGRESSION detectada · exit 2');
                writeHarnessOutput(run, cmp, args);
                process.exit(2);
            }
        }
    } else {
        console.log('ℹ Cap baseline existent · ' + baselinePath);
        console.log('  Crida amb --update-baseline per crear-ne un.');
    }

    if (args.updateBaseline) {
        const ser = serializeBaseline(run);
        fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
        fs.writeFileSync(baselinePath, JSON.stringify(ser, null, 2), 'utf8');
        console.log('✅ baseline escrit · ' + path.relative(ROOT, baselinePath));
    }

    writeHarnessOutput(run, baseline ? compareWithBaseline({ current: run, baseline }) : null, args);
}

function writeHarnessOutput(run, cmp, args) {
    const outDir = path.resolve(ROOT, args.outDir);
    fs.mkdirSync(outDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const outFile = path.join(outDir, 'harness-' + ts + (args.dryRun ? '-dryrun' : '') + '.md');
    const lines = [];
    lines.push('# VNA Quality Harness · v145');
    lines.push('');
    lines.push('· Generated · ' + new Date().toISOString());
    lines.push('· Variant · ' + (args.slim ? 'SLIM' : 'FULL'));
    lines.push('· Mode · ' + (args.dryRun ? 'DRY-RUN' : 'LIVE'));
    lines.push('');
    lines.push('## Aggregate');
    const ag = run.aggregate;
    lines.push('| Metric | Value |');
    lines.push('|---|---:|');
    lines.push('| Cases ok | ' + ag.ok + ' / ' + ag.total + ' |');
    lines.push('| Avg score | ' + ag.avgScore + ' |');
    lines.push('| Pass rate (≥70) | ' + (ag.passRate * 100).toFixed(0) + '% |');
    lines.push('| Avg tokens | ' + ag.avgTokens + ' |');
    lines.push('| Avg cost | €' + ag.avgCostEur + ' |');
    lines.push('| Total cost | €' + ag.totalCostEur + ' |');
    lines.push('');
    if (cmp?.ok) {
        lines.push('## vs Baseline');
        lines.push('| Δ | Value |');
        lines.push('|---|---:|');
        lines.push('| Δscore | ' + cmp.deltaScore + 'pp |');
        lines.push('| Δcost | ' + cmp.deltaCost + '% |');
        lines.push('| Δtokens | ' + cmp.deltaTokens + ' |');
        lines.push('| ΔpassRate | ' + cmp.deltaPassRate + 'pp |');
        lines.push('| Verdict | ' + cmp.recommendation + ' |');
        lines.push('');
    }
    lines.push('## Per case');
    lines.push('| Case | OK | Score | Tokens | Cost € | ms |');
    lines.push('|---|---|---:|---:|---:|---:|');
    for (const r of run.results) {
        lines.push('| ' + r.id + ' | ' + (r.ok ? '✓' : '⚠ ' + (r.error || '')) + ' | ' + (r.score ?? '—') + ' | ' + (r.tokens ?? '—') + ' | ' + (r.costEur ?? '—') + ' | ' + (r.ms ?? '—') + ' |');
    }
    fs.writeFileSync(outFile, lines.join('\n'), 'utf8');
    console.log('═══ Resultats · ' + path.relative(ROOT, outFile));
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
    const args = parseArgs(process.argv);
    const casesPath = args.cases || path.join(ROOT, 'knowledge/benchmarks/vna-quality-cases.json');
    const raw = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
    let cases = Array.isArray(raw?.cases) ? raw.cases : [];
    if (args.limit) cases = cases.slice(0, args.limit);

    // v145 · harness mode (quality + baseline comparison)
    if (args.harness) {
        await runHarnessMode(args, cases);
        return;
    }

    const isMulti = args.providerList.length > 1;
    console.log('=== VNA Benchmark · ' + (isMulti ? 'v132g · MULTI-PROVIDER' : 'v132f') + ' ===');
    console.log('· Cases · ' + cases.length + ' (de ' + (raw?.cases?.length || 0) + ' totals)');
    console.log('· Providers · ' + args.providerList.join(', ') + (args.model ? ' · model ' + args.model : ''));
    console.log('· Mode · ' + (args.dryRun ? 'DRY-RUN (no LLM)' : 'LIVE'));
    console.log('');

    // Construeix els N providers ABANS de córrer els casos · fail fast si una key falta
    const providerFns = {};
    for (const pname of args.providerList) {
        if (args.dryRun) {
            providerFns[pname] = dryRunProvider;
        } else {
            try { providerFns[pname] = await makeProvider(pname, args.model); }
            catch (e) { console.error('✗ provider ' + pname + ' · ' + e.message); process.exit(1); }
        }
    }

    const perProvider = {};
    for (const pname of args.providerList) {
        perProvider[pname] = await runOneProvider(pname, providerFns[pname], cases);
        console.log('');
    }

    const outDir = path.resolve(ROOT, args.outDir);
    fs.mkdirSync(outDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const outFile = path.join(outDir, 'results-' + ts + (args.dryRun ? '-dryrun' : '') + (isMulti ? '-multi' : '') + '.md');

    let md;
    if (isMulti) {
        md = renderMarkdownMulti(perProvider, {
            providers: args.providerList,
            totalCases: cases.length,
            caseIds: cases.map(c => c.id),
            limit: args.limit,
            dryRun: args.dryRun,
        });
    } else {
        const only = args.providerList[0];
        md = renderMarkdown(perProvider[only], { provider: only, model: args.model, limit: args.limit });
    }

    fs.writeFileSync(outFile, md, 'utf8');
    console.log('═══ Resultats escrits a · ' + path.relative(ROOT, outFile));
    console.log('');
    console.log(md.split('\n').slice(-14).join('\n'));
}

main().catch(e => { console.error('FATAL · ' + (e?.stack || e?.message || e)); process.exit(1); });
