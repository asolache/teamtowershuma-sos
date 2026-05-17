#!/usr/bin/env node
// =============================================================================
// TEAMTOWERS SOS V11 — v132f · BENCHMARK RUNNER CLI · VNA A/B (FULL vs SLIM)
// Ruta · /scripts/run-vna-benchmark.mjs
//
// Executa els 20 casos canonical de `knowledge/benchmarks/vna-quality-cases.json`
// amb LLM real (Anthropic Claude per defecte · llegit de env ANTHROPIC_API_KEY)
// i omple una taula markdown amb tokens · score · winner per omplir el doc
// `docs/PROMPT-EFFICIENCY-LESSONS.md`.
//
// Ús ·
//   ANTHROPIC_API_KEY=sk-ant-... node scripts/run-vna-benchmark.mjs
//   node scripts/run-vna-benchmark.mjs --cases knowledge/benchmarks/vna-quality-cases.json --limit 3
//   node scripts/run-vna-benchmark.mjs --dry-run         # imprimeix prompts sense cridar LLM
//   node scripts/run-vna-benchmark.mjs --provider openai # OPENAI_API_KEY
//
// Sortida · imprimeix taula markdown + escriu a docs/benchmarks/results-<ts>.md
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runABTest, summarizeABTests } from '../js/core/promptABTestService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── CLI args parsing ───────────────────────────────────────────────────────
function parseArgs(argv) {
    const args = { cases: null, limit: null, dryRun: false, provider: 'anthropic', model: null, outDir: 'docs/benchmarks' };
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--cases')          args.cases   = argv[++i];
        else if (a === '--limit')     args.limit   = parseInt(argv[++i], 10);
        else if (a === '--provider')  args.provider= argv[++i];
        else if (a === '--model')     args.model   = argv[++i];
        else if (a === '--out')       args.outDir  = argv[++i];
        else if (a === '--dry-run')   args.dryRun  = true;
        else if (a === '--help' || a === '-h') {
            console.log('Usage · ANTHROPIC_API_KEY=... node scripts/run-vna-benchmark.mjs [--cases path] [--limit n] [--provider anthropic|openai] [--model id] [--dry-run]');
            process.exit(0);
        }
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
    throw new Error('provider desconegut · ' + name);
}

// ── Render markdown summary ────────────────────────────────────────────────
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

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
    const args = parseArgs(process.argv);
    const casesPath = args.cases || path.join(ROOT, 'knowledge/benchmarks/vna-quality-cases.json');
    const raw = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
    let cases = Array.isArray(raw?.cases) ? raw.cases : [];
    if (args.limit) cases = cases.slice(0, args.limit);

    console.log('=== VNA Benchmark · v132f ===');
    console.log('· Cases · ' + cases.length + ' (de ' + (raw?.cases?.length || 0) + ' totals)');
    console.log('· Provider · ' + args.provider + (args.model ? ' · ' + args.model : ''));
    console.log('· Mode · ' + (args.dryRun ? 'DRY-RUN (no LLM)' : 'LIVE'));
    console.log('');

    let provider = null;
    if (!args.dryRun) {
        try { provider = await makeProvider(args.provider, args.model); }
        catch (e) { console.error('✗ ' + e.message); process.exit(1); }
    } else {
        // Dry-run provider · retorna JSON mínim sintètic
        provider = async () => ({ text: JSON.stringify({
            roles: [{ id: 'r1' }, { id: 'r2' }], transactions: [{ from: 'r1', to: 'r2' }], deliverables: [],
        }), usage: { inputTokens: 100, outputTokens: 50 } });
    }

    const results = [];
    for (let i = 0; i < cases.length; i++) {
        const c = cases[i];
        const tag = '[' + (i + 1) + '/' + cases.length + '] ' + c.id;
        process.stdout.write(tag + ' · ');
        try {
            const r = await runABTest({
                context: { name: c.name, description: c.description, sector: c.sector, vna_zoom: 'mid' },
                provider,
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

    const md = renderMarkdown(results, { provider: args.provider, model: args.model, limit: args.limit });
    const outDir = path.resolve(ROOT, args.outDir);
    fs.mkdirSync(outDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const outFile = path.join(outDir, 'results-' + ts + (args.dryRun ? '-dryrun' : '') + '.md');
    fs.writeFileSync(outFile, md, 'utf8');
    console.log('');
    console.log('═══ Resultats escrits a · ' + path.relative(ROOT, outFile));
    console.log('');
    console.log(md.split('\n').slice(-12).join('\n'));
}

main().catch(e => { console.error('FATAL · ' + (e?.stack || e?.message || e)); process.exit(1); });
