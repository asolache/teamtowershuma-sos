#!/usr/bin/env node
// =============================================================================
// TEAMTOWERS SOS V11 — v146 · EXPORT TRAINING DATASET CLI
// Ruta · /scripts/export-training-dataset.mjs
//
// Exporta el JSONL d'entrenament local del KB SOS · llest per a pujar a
// cloud GPU (HuggingFace Hub · Together · Modal · RunPod · etc) o per a
// entrenar localment si tens GPU (Mac M-series amb MLX · NVIDIA amb CUDA).
//
// Ús ·
//   node scripts/export-training-dataset.mjs                     # default alpaca · 1000 samples
//   node scripts/export-training-dataset.mjs --format chatml     # OpenAI · Anthropic · Mistral
//   node scripts/export-training-dataset.mjs --format sharegpt   # Axolotl-friendly
//   node scripts/export-training-dataset.mjs --max 500 --out my-dataset.jsonl
//   node scripts/export-training-dataset.mjs --no-wos            # només skills + maps
//
// Sortida · JSONL a docs/training/dataset-<format>-<ts>.jsonl + stats meta.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDataset, serializeJsonl, SUPPORTED_FORMATS } from '../js/core/llmTrainingDataset.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
    const args = {
        format: 'alpaca', max: 1000, out: null,
        includeSkills: true, includeWOs: true, includeValueMaps: true,
        includeCanvases: true, includePitches: true,
        kbFile: null,
    };
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--format')   args.format = argv[++i];
        else if (a === '--max') args.max    = parseInt(argv[++i], 10);
        else if (a === '--out') args.out    = argv[++i];
        else if (a === '--kb-file') args.kbFile = argv[++i];   // JSON dump del KB
        else if (a === '--no-skills')      args.includeSkills    = false;
        else if (a === '--no-wos')         args.includeWOs       = false;
        else if (a === '--no-maps')        args.includeValueMaps = false;
        else if (a === '--no-canvases')    args.includeCanvases  = false;
        else if (a === '--no-pitches')     args.includePitches   = false;
        else if (a === '--help' || a === '-h') {
            console.log('Usage · node scripts/export-training-dataset.mjs [options]');
            console.log('  --format <alpaca|chatml|sharegpt>  (default alpaca)');
            console.log('  --max <n>                          (default 1000)');
            console.log('  --out <path>                       (default docs/training/dataset-<fmt>-<ts>.jsonl)');
            console.log('  --kb-file <path>                   load KB nodes from JSON file (Node-only · sense IndexedDB)');
            console.log('  --no-skills | --no-wos | --no-maps | --no-canvases | --no-pitches');
            process.exit(0);
        }
    }
    return args;
}

// File-based KB mock per a Node · llegeix JSON {nodes: [...]} o array
function loadFileKb(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error('--kb-file no existeix · ' + filePath);
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const nodes = Array.isArray(data) ? data : (data.nodes || []);
    return {
        query: async (filter) => nodes.filter(n => !filter?.type || n?.type === filter.type),
    };
}

async function main() {
    const args = parseArgs(process.argv);
    if (!SUPPORTED_FORMATS.includes(args.format)) {
        console.error('✗ format no suportat · ' + args.format + ' · usa ' + SUPPORTED_FORMATS.join('|'));
        process.exit(1);
    }

    console.log('=== Export training dataset · v146 ===');
    console.log('· Format · ' + args.format);
    console.log('· Max · ' + args.max);
    console.log('· KB source · ' + (args.kbFile ? args.kbFile : 'auto (./js/core/kb.js · IndexedDB · NO disponible a Node)'));
    console.log('');

    let kb = null;
    if (args.kbFile) {
        try { kb = loadFileKb(path.resolve(args.kbFile)); }
        catch (e) { console.error('✗ ' + e.message); process.exit(1); }
    }

    const result = await buildDataset({
        kb,
        format: args.format,
        maxSamples: args.max,
        includeSkills: args.includeSkills,
        includeWOs: args.includeWOs,
        includeValueMaps: args.includeValueMaps,
        includeCanvases: args.includeCanvases,
        includePitches: args.includePitches,
    });

    if (!result.ok) {
        console.error('✗ ' + result.error);
        if (result.error === 'kb-unavailable' && !args.kbFile) {
            console.error('  Tip · usa --kb-file <path.json> per a executar a Node sense IndexedDB');
            console.error('  El path ha de ser un JSON · array de nodes o { nodes: [...] }');
        }
        process.exit(1);
    }

    const outDir = path.join(ROOT, 'docs/training');
    fs.mkdirSync(outDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const outFile = args.out ? path.resolve(args.out)
        : path.join(outDir, 'dataset-' + args.format + '-' + ts + '.jsonl');
    fs.writeFileSync(outFile, serializeJsonl(result.samples), 'utf8');

    // Meta companion
    const metaFile = outFile + '.meta.json';
    fs.writeFileSync(metaFile, JSON.stringify({
        version: 'v146',
        format:  args.format,
        ts:      new Date().toISOString(),
        stats:   result.stats,
    }, null, 2), 'utf8');

    console.log('Stats ·');
    console.log('· Total samples · ' + result.stats.total);
    console.log('· By source · ');
    for (const [src, n] of Object.entries(result.stats.bySource)) {
        console.log('    ' + src + ' · ' + n);
    }
    console.log('');
    console.log('═══ Output · ' + path.relative(ROOT, outFile));
    console.log('═══ Meta   · ' + path.relative(ROOT, metaFile));
}

main().catch(e => { console.error('FATAL · ' + (e?.stack || e?.message || e)); process.exit(1); });
