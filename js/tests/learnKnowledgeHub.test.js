// LEARN-HUB-001 · tests · index loader + roadmaps + 3 modes
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    INDEX_VERSION, _setCacheForTests, searchIndex, listByFolder,
    listRoles, getRoadmap, stats,
} from '../core/knowledgeIndexService.js';
import { ROADMAPS_BY_ROLE, ROADMAPS_VERSION } from '../core/knowledgeRoadmaps.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== LEARN-HUB · knowledge index + roadmaps ===\n');

// ─── A · index file generat existeix ────────────────────────────────────
const indexPath = path.join(REPO_ROOT, 'knowledge/_search-index.json');
t(fs.existsSync(indexPath),                              'A · _search-index.json existeix · executar scripts/generate-knowledge-index.mjs');
const idx = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
t(idx.totalFiles >= 40,                                  'A · ≥40 fitxers indexats (got ' + idx.totalFiles + ')');
t(Array.isArray(idx.items),                              'A · items array');
eq(idx.version, 'v1.0',                                  'A · index v1.0');

// Inject cache
_setCacheForTests(idx);

// ─── B · stats · agregació ───────────────────────────────────────────────
const st = stats(idx);
t(st.total >= 40,                                        'B · total ≥40');
t(st.byType.soc > 0,                                     'B · ≥1 SOC');
t(st.byType.vision > 0,                                  'B · ≥1 vision');
t(st.rolesAvailable >= 6,                                'B · ≥6 roadmaps disponibles');

// ─── C · listByFolder · agrupació per folder ───────────────────────────
const byFolder = listByFolder(idx);
const folders = Object.keys(byFolder);
t(folders.includes('vision'),                            'C · folder vision present');
t(folders.includes('socs'),                              'C · folder socs present');
t(folders.includes('sectors'),                           'C · folder sectors present');
t(byFolder.vision.length >= 5,                           'C · vision · ≥5 docs');

// ─── D · searchIndex · query + filters ─────────────────────────────────
{
    const all = searchIndex({}, idx);
    eq(all.length, Math.min(50, idx.items.length),       'D · sense query · tots (capat al limit)');
}
{
    // Type filter
    const socs = searchIndex({ type: 'soc' }, idx);
    t(socs.length >= 5,                                  'D · type:soc · ≥5');
    t(socs.every(s => s.type === 'soc'),                 'D · type:soc · tots són SOC');
}
{
    // Query
    const vna = searchIndex({ query: 'vna' }, idx);
    t(vna.length >= 1,                                   'D · query "vna" · ≥1 resultat');
}
{
    // Folder filter
    const sectors = searchIndex({ folder: 'sectors' }, idx);
    t(sectors.length >= 20,                              'D · folder:sectors · ≥20 (CNAE)');
}
{
    // Phase filter (lifecycle SOCs)
    const idea = searchIndex({ phase: 'idea' }, idx);
    t(idea.length >= 1,                                  'D · phase:idea · ≥1');
    t(idea.every(i => i.phase === 'idea'),               'D · phase filter strict');
}
{
    // Sector filter
    const sectorA = searchIndex({ sector: 'A' }, idx);
    t(sectorA.length >= 1,                               'D · sector A · ≥1');
}

// ─── E · ROADMAPS · 10 rols canònics ───────────────────────────────────
eq(ROADMAPS_VERSION, 'v1.0',                             'E · roadmaps version');
const roles = listRoles();
t(roles.length >= 6,                                     'E · ≥6 rols (got ' + roles.length + ')');
const expectedRoles = ['visioner', 'architect', 'cohort_manager', 'sentinel', 'curator', 'connector', 'founder_anchor', 'operations', 'creator', 'reviewer'];
for (const r of expectedRoles) {
    t(roles.includes(r),                                 'E · rol ' + r + ' present');
}

// ─── F · getRoadmap · resol path → items ───────────────────────────────
{
    const rm = getRoadmap('visioner', idx);
    t(rm,                                                 'F · roadmap visioner trobat');
    t(rm.readings.length >= 5,                           'F · ≥5 lectures');
    t(rm.foundCount >= 4,                                'F · ≥4 fitxers resolts (got ' + rm.foundCount + '/' + rm.totalSteps + ')');
    t(rm.readings.some(r => r.found && r.item),          'F · almenys 1 amb item');
    eq(rm.roleName, 'Visioner · Cap de Colla',           'F · roleName correcte');
}
{
    const rm = getRoadmap('architect', idx);
    t(rm && rm.foundCount >= 3,                          'F · architect · ≥3 resolts');
}
{
    const rm = getRoadmap('nonexistent', idx);
    eq(rm, null,                                         'F · rol inexistent · null');
}

// ─── G · cada roadmap té estructura mínima ─────────────────────────────
for (const r of roles) {
    const rm = ROADMAPS_BY_ROLE[r];
    t(rm.roleName && rm.description,                     'G · ' + r + ' · roleName + description');
    t(Array.isArray(rm.readings) && rm.readings.length >= 3, 'G · ' + r + ' · ≥3 lectures');
    t(rm.readings.every(r => r.step && r.title && r.path && r.why), 'G · ' + r + ' · readings ben formats');
}

// ─── H · index frescos · cap fitxer del knowledge sense entry ───────────
{
    // Read knowledge dir directly · check no orphan
    function walkMd(dir, list = []) {
        if (!fs.existsSync(dir)) return list;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (entry.name.startsWith('.')) continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walkMd(full, list);
            else if (entry.name.endsWith('.md') && !['_README.md', '_LOG.md', '_index.md'].includes(entry.name)) list.push(full);
        }
        return list;
    }
    const realFiles = walkMd(path.join(REPO_ROOT, 'knowledge'));
    const indexedPaths = new Set(idx.items.map(i => i.path));
    let missing = 0;
    for (const f of realFiles) {
        const rel = path.relative(REPO_ROOT, f).replace(/\\/g, '/');
        if (!indexedPaths.has(rel)) {
            console.error('  ✘ no indexed · ' + rel);
            missing++;
        }
    }
    eq(missing, 0,                                       'H · cap fitxer .md sense entry a l\'index');
    t(realFiles.length === idx.totalFiles,               'H · count match · realFiles=' + realFiles.length + ' index=' + idx.totalFiles);
}

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
