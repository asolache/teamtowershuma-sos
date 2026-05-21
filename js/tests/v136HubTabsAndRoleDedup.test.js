// =============================================================================
// TEAMTOWERS SOS V11 — v136 · ProjectHubV2 tabs + roleDedup · TDD
// Ruta · /js/tests/v136HubTabsAndRoleDedup.test.js
//
// Verifica ·
//  · ProjectHubV2View té les 6 tabs IA-aligned + dropdown + render funcional
//  · roleDedup.js · embedding similarity · detect + merge · 5/7 items DONE
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    ROLE_DEDUP_VERSION,
    cosineSimilarity, roleSignature,
    detectDuplicateRoles, mergeDuplicates, dedupRoles,
    makeMockEmbedder, makeOpenAIEmbedder,
} from '../core/roleDedup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v136 · ProjectHubV2 tabs IA-aligned + roleDedup · TDD ===\n');

// ════════════════════════════════════════════════════════════════════════
// PART A · ProjectHubV2View · canonical tabs integrades a la vista real
// ════════════════════════════════════════════════════════════════════════
console.log('— A · ProjectHubV2View · canonical tabs');
const v2Src = fs.readFileSync(path.join(ROOT, 'js/views/ProjectHubV2View.js'), 'utf8');
ok('A · imports SubmenuTabs',                     v2Src.includes("from '../ui/SubmenuTabs.js'"));
ok('A · TPL_VERSION bump · canonical-tabs',       v2Src.includes('canonical-tabs'));
ok('A · HUB_TABS · 6 ids alineats al menú',       v2Src.includes("id: 'hub'") && v2Src.includes("id: 'crear'") &&
                                                    v2Src.includes("id: 'treballar'") && v2Src.includes("id: 'comptabilitzar'") &&
                                                    v2Src.includes("id: 'connectar'") && v2Src.includes("id: 'equip'"));
ok('A · HUB_DROPDOWN · 4 items',                  v2Src.includes("id: 'aprendre'") &&
                                                    v2Src.includes("id: 'sprints'") &&
                                                    v2Src.includes("id: 'lifecycle'") &&
                                                    v2Src.includes("id: 'settings'"));
ok('A · HUB_PILLAR_LINKS · 5 pilars amb links',   /HUB_PILLAR_LINKS[\s\S]+?crear:[\s\S]+?treballar:[\s\S]+?comptabilitzar:[\s\S]+?connectar:[\s\S]+?equip:/.test(v2Src));
ok('A · pillar crear · 4 vistes (canvas/pitch/pact/presentation)',
                                                    /crear:[\s\S]{0,400}canvas[\s\S]{0,400}pitch[\s\S]{0,400}pact[\s\S]{0,400}presentation/.test(v2Src));
ok('A · pillar treballar · Quality inclosa',       /treballar:[\s\S]+?\/quality/.test(v2Src));
ok('A · pillar comptabilitzar · 5 (wallet/account/value/invoices/tokenomics)',
                                                    /comptabilitzar:[\s\S]{0,600}\/wallet[\s\S]+?\/accounting[\s\S]+?\/value-accounting[\s\S]+?\/invoices[\s\S]+?\/tokenomics/.test(v2Src));

ok('A · constructor llegeix ?tab URL',             v2Src.includes("getActiveTabFromUrl('tab'"));
ok('A · _mode default · hub',                      v2Src.includes("this._mode = VALID_TAB_IDS.has(urlTab) ? urlTab : 'hub'"));
ok('A · mount id="hubSubmenu" entre topbar i main',v2Src.includes('id="hubSubmenu"') && v2Src.includes('renderSubmenuTabs({ tabs: HUB_TABS'));
ok('A · renderHubContent embolcalla 8 zones',     /_renderHubContent[\s\S]+?_zone0_Legendary[\s\S]+?_zone8_AdvancedTools/.test(v2Src));
// v141+v142 · `_renderPillarContent` refactor · ara renderitza l2 submenu + in-tab preview
// El test es delega a v141v142SubmenuV2AndInTab.test.js · aquí només contracte estable.
ok('A · _renderPillarContent · context project preservat',
                                                    v2Src.includes('_renderPillarContent(') &&
                                                    v2Src.includes("encodeURIComponent(project.id)"));
ok('A · afterRender bind submenu · re-render',     v2Src.includes('bindSubmenuTabs(mount,') && v2Src.includes('this.render();'));
ok('A · destroy cleanup listener',                 v2Src.includes('destroy()') && v2Src.includes('this._cleanupTabs'));

// ════════════════════════════════════════════════════════════════════════
// PART B · roleDedup · API + algorithms
// ════════════════════════════════════════════════════════════════════════
console.log('\n— B · roleDedup API');
ok('B · ROLE_DEDUP_VERSION = v136',                ROLE_DEDUP_VERSION === 'v136');
ok('B · cosineSimilarity function',                typeof cosineSimilarity === 'function');
ok('B · roleSignature function',                   typeof roleSignature === 'function');
ok('B · detectDuplicateRoles async',               typeof detectDuplicateRoles === 'function');
ok('B · mergeDuplicates function',                 typeof mergeDuplicates === 'function');
ok('B · dedupRoles composite',                     typeof dedupRoles === 'function');
ok('B · makeMockEmbedder factory',                 typeof makeMockEmbedder === 'function');
ok('B · makeOpenAIEmbedder factory',               typeof makeOpenAIEmbedder === 'function');

// ─── C · cosineSimilarity · math correctness ──────────────────────────
console.log('\n— C · cosineSimilarity');
ok('C · vectors idèntics · sim=1',                 cosineSimilarity([1,2,3], [1,2,3]) === 1);
ok('C · vectors ortogonals · sim=0',               cosineSimilarity([1,0], [0,1]) === 0);
ok('C · vectors oposats · sim=-1',                 cosineSimilarity([1,0], [-1,0]) === -1);
ok('C · zero vector · sim=0',                      cosineSimilarity([0,0], [1,1]) === 0);
ok('C · length mismatch · sim=0',                  cosineSimilarity([1], [1,2]) === 0);
ok('C · empty arrays · sim=0',                     cosineSimilarity([], []) === 0);

// ─── D · roleSignature · canonical text ───────────────────────────────
console.log('\n— D · roleSignature');
ok('D · name+kind+desc concatenat lowercase',     roleSignature({ name: 'Doctor', kind: 'expert', description: 'Salut' }) === 'doctor · [expert] · salut');
ok('D · castell_level incluit',                    roleSignature({ name: 'A', castell_level: 'pinya' }).includes('(pinya)'));
ok('D · null role · ""',                           roleSignature(null) === '');
ok('D · sense camps · ""',                         roleSignature({}) === '');

// ─── E · detectDuplicateRoles · happy path · mock embedder ────────────
console.log('\n— E · detectDuplicateRoles · happy');
{
    const roles = [
        { id: 'r1', name: 'Productor de pa' },
        { id: 'r2', name: 'Productor de pa artesà' },  // similar
        { id: 'r3', name: 'Aficionat' },               // diferent
        { id: 'r4', name: 'Forner' },                  // diferent
    ];
    const embedder = makeMockEmbedder({ dim: 16 });
    const r = await detectDuplicateRoles({ roles, embedder, threshold: 0.7 });
    ok('E · ok=true',                                  r.ok === true);
    ok('E · pairs > 0 (algun parell similar trobat)',  r.pairs.length >= 1);
    const sim = r.pairs[0];
    ok('E · pair · similarity ≥ threshold',             sim.similarity >= 0.7);
    ok('E · pair · té a + b ids',                       typeof sim.a === 'string' && typeof sim.b === 'string');
    ok('E · pair · té aName + bName',                   typeof sim.aName === 'string' && typeof sim.bName === 'string');
    ok('E · pairs sorted desc per similarity',          r.pairs.every((p, i) => i === 0 || p.similarity <= r.pairs[i-1].similarity));
}

// ─── F · detectDuplicateRoles · validacions ───────────────────────────
console.log('\n— F · detectDuplicateRoles · validacions');
{
    const r0 = await detectDuplicateRoles({ roles: [{ id: 'r1' }], embedder: makeMockEmbedder() });
    ok('F · <2 roles · ok=true · pairs vacis',         r0.ok === true && r0.pairs.length === 0 && r0.reason === 'less-than-2-roles');
    const r1 = await detectDuplicateRoles({ roles: [{ id: 'a' }, { id: 'b' }] });
    ok('F · sense embedder · ok=false · no-embedder',  r1.ok === false && r1.error.includes('no-embedder'));
    const r2 = await detectDuplicateRoles({ roles: [{ id: 'a' }, { id: 'b' }], embedder: async () => { throw new Error('boom'); } });
    ok('F · embedder error · ok=false · embedder-failed', r2.ok === false && r2.error.includes('embedder-failed'));
    const r3 = await detectDuplicateRoles({ roles: [{ id: 'a' }, { id: 'b' }], embedder: async () => [[1,2,3]] /* 1 vector per 2 textos */ });
    ok('F · bad shape · ok=false · embedder-bad-shape',r3.ok === false && r3.error.includes('embedder-bad-shape'));
}

// ─── G · mergeDuplicates · pure · remap transactions ──────────────────
console.log('\n— G · mergeDuplicates');
{
    const map = {
        roles: [
            { id: 'r1', name: 'Productor' },
            { id: 'r2', name: 'Productor artesà' },
            { id: 'r3', name: 'Client' },
        ],
        transactions: [
            { from: 'r1', to: 'r3', type: 'tangible' },
            { from: 'r2', to: 'r3', type: 'intangible' },  // ha de remapar from r2 → r1
            { from: 'r3', to: 'r1', type: 'tangible' },
        ],
        deliverables: [{ name: 'd1' }],
    };
    const pairs = [{ a: 'r1', b: 'r2', similarity: 0.92 }];
    const out = mergeDuplicates(map, pairs);
    ok('G · roles · 2 (r2 fusionat a r1)',             out.roles.length === 2);
    ok('G · merged · array amb {from:r2, to:r1, lostName}', out.merged.length === 1 &&
                                                              out.merged[0].from === 'r2' && out.merged[0].to === 'r1' &&
                                                              out.merged[0].lostName === 'Productor artesà');
    ok('G · transactions remapejades · r2→r3 ara r1→r3',
                                                       out.transactions.some(t => t.from === 'r1' && t.to === 'r3' && t.type === 'intangible'));
    ok('G · self-loops descartats',                    !out.transactions.some(t => t.from === t.to));
    ok('G · transactions dedupe (r1→r3 tangible apareix només 1 cop)',
                                                       out.transactions.filter(t => t.from === 'r1' && t.to === 'r3' && t.type === 'tangible').length === 1);
}

// ─── H · mergeDuplicates · transitive (a~b, b~c → c→a) ────────────────
console.log('\n— H · mergeDuplicates · transitive chain');
{
    const map = {
        roles: [
            { id: 'r1', name: 'A' },
            { id: 'r2', name: 'B' },
            { id: 'r3', name: 'C' },
            { id: 'r4', name: 'Z (diferent)' },
        ],
        transactions: [{ from: 'r3', to: 'r4' }],
    };
    const pairs = [
        { a: 'r1', b: 'r2', similarity: 0.95 },
        { a: 'r2', b: 'r3', similarity: 0.91 },  // transitive · r3 ha d'anar a r1 via r2→r1
    ];
    const out = mergeDuplicates(map, pairs);
    ok('H · only 2 roles left (r1 + r4)',              out.roles.length === 2 && out.roles.find(r => r.id === 'r1') && out.roles.find(r => r.id === 'r4'));
    ok('H · transaction r3→r4 remapped a r1→r4',       out.transactions.some(t => t.from === 'r1' && t.to === 'r4'));
}

// ─── I · dedupRoles · composite · happy path ──────────────────────────
console.log('\n— I · dedupRoles composite');
{
    const map = {
        roles: [
            { id: 'r1', name: 'Forner artesà' },
            { id: 'r2', name: 'Forner artesa' },     // typo · similar
            { id: 'r3', name: 'Client habitual' },
        ],
        transactions: [{ from: 'r1', to: 'r3' }, { from: 'r2', to: 'r3' }],
        deliverables: [],
    };
    const r = await dedupRoles({ map, embedder: makeMockEmbedder({ dim: 32 }), threshold: 0.6 });
    ok('I · ok=true',                                  r.ok === true);
    ok('I · ms ≥ 0',                                   typeof r.ms === 'number' && r.ms >= 0);
    if (r.pairs.length > 0) {
        ok('I · rolesAfter ≤ rolesBefore',              r.rolesAfter <= r.rolesBefore);
        ok('I · updatedMap.transactions dedupe',        r.updatedMap.transactions.length <= map.transactions.length);
    } else {
        ok('I · sense pairs · noChanges=true',          r.noChanges === true);
    }
}

// ─── J · dedupRoles · embedder error propagat ─────────────────────────
console.log('\n— J · dedupRoles · embedder error');
{
    const r = await dedupRoles({
        map: { roles: [{ id: 'a' }, { id: 'b' }] },
        embedder: async () => { throw new Error('quota'); },
    });
    ok('J · ok=false · error propagat',                r.ok === false && r.error.includes('embedder-failed'));
}

// ─── K · makeMockEmbedder · determinístic · texts iguals → vectors iguals
console.log('\n— K · makeMockEmbedder determinístic');
{
    const e = makeMockEmbedder({ dim: 4 });
    const [v1, v2] = await e(['hello world', 'hello world']);
    ok('K · mateix text · mateix vector',              JSON.stringify(v1) === JSON.stringify(v2));
    const e2 = makeMockEmbedder({ dim: 32 });
    const [v3, v4] = await e2(['Productor de pa artesà cooperatiu', 'Client habitual del barri']);
    ok('K · textos diferents · vectors diferents',     JSON.stringify(v3) !== JSON.stringify(v4));
}

// ─── L · makeOpenAIEmbedder · factory · throws sense apiKey ────────────
console.log('\n— L · makeOpenAIEmbedder factory');
{
    let threw = false;
    try { makeOpenAIEmbedder({}); } catch (_) { threw = true; }
    ok('L · sense apiKey · throw',                     threw);
    const e = makeOpenAIEmbedder({ apiKey: 'sk-test' });
    ok('L · amb apiKey · retorna async fn',            typeof e === 'function');
}

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
