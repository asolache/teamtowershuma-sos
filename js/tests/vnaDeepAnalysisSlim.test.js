// =============================================================================
// TEAMTOWERS SOS V11 — VNA DEEP ANALYSIS + SLIM PROMPT · TDD (v132b)
// Ruta · /js/tests/vnaDeepAnalysisSlim.test.js
//
// Verifica · SYSTEM_BASE_SLIM nou + buildPrompt accepta slim:true + ratio
// estalvi ≥ 40% + análisi doc + buildVariantARealPrompt async.
// =============================================================================

import fs from 'node:fs';
import { SYSTEM_BASE, SYSTEM_BASE_SLIM, buildPrompt } from '../core/vnaExpertPrompts.js';
import { buildVariantAPrompt, buildVariantARealPrompt, buildVariantBPrompt, scoreOutput, compareOutputs } from '../core/promptABTestService.js';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== VNA DEEP ANALYSIS + SLIM PROMPT (v132b) ===\n');

// ─── A · SYSTEM_BASE_SLIM existeix · ~50% més curt ─────────────────────
console.log('— A · SYSTEM_BASE_SLIM definit');
ok('A · SYSTEM_BASE_SLIM exportat',                typeof SYSTEM_BASE_SLIM === 'string');
ok('A · SLIM més curt que FULL',                    SYSTEM_BASE_SLIM.length < SYSTEM_BASE.length);
ok('A · SLIM ≤ ~1700 chars',                        SYSTEM_BASE_SLIM.length <= 1700);
ok('A · SLIM manté 5 PRINCIPIS VNA SAGRATS',        SYSTEM_BASE_SLIM.includes('5 PRINCIPIS VNA SAGRATS'));
ok('A · SLIM manté MODEL CASTELLER',                SYSTEM_BASE_SLIM.includes('MODEL CASTELLER'));
ok('A · SLIM manté CONTRACTE SORTIDA',              SYSTEM_BASE_SLIM.includes('CONTRACTE SORTIDA'));
ok('A · SLIM elimina MARC D\'ANÀLISI exhaustiu',    !SYSTEM_BASE_SLIM.includes('MARC D\'ANÀLISI'));
ok('A · SLIM elimina PRINCIPIS DE DISSENY (KISS·DRY explicit)',
   !SYSTEM_BASE_SLIM.includes('PRINCIPIS DE DISSENY'));

// ─── B · buildPrompt accepta slim:true ────────────────────────────────
console.log('\n— B · buildPrompt({slim:true}) opt-in');
const ctx = { name: 'FC Lleida', description: 'Equip futbol semiprofessional', sector: 'R', vna_zoom: 'mid' };
const full = buildPrompt({ taskKind: 'design-value-map-rich', context: ctx, slim: false });
const slim = buildPrompt({ taskKind: 'design-value-map-rich', context: ctx, slim: true });
ok('B · full retorna .slim = false',                full.slim === false);
ok('B · slim retorna .slim = true',                 slim.slim === true);
ok('B · slim tokens < full tokens',                 slim.approxTokens < full.approxTokens);
const saving = ((full.approxTokens - slim.approxTokens) / full.approxTokens) * 100;
ok('B · saving ≥ 40%',                              saving >= 40);
ok('B · slim manté els 5 principis Verna Allee',    slim.system.includes('Verna Allee'));
ok('B · slim manté castell levels',                 /pom_de_dalt|tronc|pinya/.test(slim.system));

// ─── C · default · buildPrompt SENSE slim = full (backward compat) ────
console.log('\n— C · backward compat · default = full');
const def = buildPrompt({ taskKind: 'design-value-map-rich', context: ctx });
ok('C · default = full',                            def.system === SYSTEM_BASE);
ok('C · default.slim = false',                      def.slim === false);

// ─── D · buildVariantARealPrompt · usa el prompt REAL via async ───────
console.log('\n— D · buildVariantARealPrompt async · usa prompt REAL');
const real = await buildVariantARealPrompt(ctx);
ok('D · label = real-vna-expert-chain',             real.label === 'real-vna-expert-chain');
ok('D · approxTokens > 2000 (prompt REAL)',         real.approxTokens > 2000);
ok('D · system inclou SYSTEM_BASE complet',          real.system.length > 3000);

const b = buildVariantBPrompt(ctx);
ok('D · variant B segueix essent < 250 tokens',     b.approxTokens < 250);

const realVsB = real.approxTokens - b.approxTokens;
ok('D · REAL vs MINIMAL · ≥ 1500 tokens diff',      realVsB >= 1500);

// ─── E · Anàlisi doc · vna-deep-analysis-v132b.md ─────────────────────
console.log('\n— E · doc anàlisi profund');
const docExists = fs.existsSync(new URL('../../docs/vna-deep-analysis-v132b.md', import.meta.url));
ok('E · doc existeix',                              docExists);
if (docExists) {
    const doc = fs.readFileSync(new URL('../../docs/vna-deep-analysis-v132b.md', import.meta.url), 'utf8');
    ok('E · TL;DR amb 5 descobertes',               doc.includes('TL;DR') && doc.includes('descobertes'));
    ok('E · taula tokens A vs B amb 5 casos',       doc.includes('FC Lleida') && doc.includes('Cooperativa Cures') && doc.includes('Som Energia'));
    ok('E · diagnòstic 3 parts (cadena · sugerir · domain/sector)',
       doc.includes('cadena expert') && doc.includes('Sugerir con IA') && doc.includes('Domain detector'));
    ok('E · 5 weaknesses identificats',              doc.includes('Weaknesses') && doc.includes('Strengths'));
    ok('E · 4 factors per què "Sugerir con IA" sembla millor',
       doc.includes('Factor 1') && doc.includes('Factor 2') && doc.includes('Factor 3') && doc.includes('Factor 4'));
    ok('E · gap analysis 6 punts (1-6)',             doc.includes('Gap 1') && doc.includes('Gap 6'));
    ok('E · recomanació estratègica per @alvaro',    doc.includes('Recomanació estratègica per @alvaro'));
    ok('E · roadmap v132c → v140',                   doc.includes('v132c') && doc.includes('v140'));
    ok('E · què falta · 7 items',                    doc.includes('Pre-thinking') && doc.includes('Multi-turn') && doc.includes('xAPI'));
}

// ─── F · scoreOutput integració · valida la hipòtesi ──────────────────
console.log('\n— F · scoreOutput · validació hipòtesi qualitat');
const goodOutput = {
    roles: Array.from({length: 6}, (_, i) => ({ id: 'r'+i, castell_level: ['pom_de_dalt','tronc','pinya','laterals','mans','baixos'][i] })),
    transactions: [
        { from: 'r0', to: 'r1', type: 'tangible' },
        { from: 'r1', to: 'r0', type: 'intangible' },
        { from: 'r2', to: 'r3', type: 'tangible' },
        { from: 'r3', to: 'r4', type: 'intangible' },
    ],
    deliverables: [
        { kind: 'intangible', name: 'Confiança vestuari professional' },
        { kind: 'intangible', name: 'Identitat institucional del club' },
        { kind: 'tangible', name: 'Alineació partit jornada 5' },
    ],
};
const sc = scoreOutput(goodOutput);
ok('F · good output score ≥ 85',                    sc.score >= 85);
ok('F · castell_coverage = 6',                       sc.castell_coverage === 6);
ok('F · reciprocal_cycles ≥ 1',                      sc.reciprocal_cycles >= 1);

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
