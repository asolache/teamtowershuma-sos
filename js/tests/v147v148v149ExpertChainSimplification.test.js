// =============================================================================
// TEAMTOWERS SOS V11 — v147+v148+v149 · expert chain simplification · TDD
// Ruta · /js/tests/v147v148v149ExpertChainSimplification.test.js
//
// Verifica · (1) v147 SLIM auto per fase + personalize-landing eliminat +
// landing template post-chain · (2) v148 clarifyBeforeRun + gapDetect ·
// (3) v149 roleDedup + CI workflow.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHAIN_PHASES, runExpertChain } from '../core/expertChainOrchestrator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v147+v148+v149 · expert chain simplification · TDD ===\n');

// ─── A · v147 · CHAIN_PHASES sense landing · slimByDefault per fase ────
console.log('— A · v147 · CHAIN_PHASES refactor');
ok('A · 7 fases (landing eliminat · era 8)',                 CHAIN_PHASES.length === 7);
ok('A · personalize-landing NO present a CHAIN_PHASES',     !CHAIN_PHASES.some(p => p.id === 'personalize-landing'));
ok('A · design-value-map-rich · slimByDefault=false (FULL)',CHAIN_PHASES.find(p => p.id === 'design-value-map-rich').slimByDefault === false);
ok('A · generate-socs · slimByDefault=false (FULL)',         CHAIN_PHASES.find(p => p.id === 'generate-socs-from-value-map').slimByDefault === false);
ok('A · define-product-service · slimByDefault=true',         CHAIN_PHASES.find(p => p.id === 'define-product-service').slimByDefault === true);
ok('A · personalize-canvas · slimByDefault=true',             CHAIN_PHASES.find(p => p.id === 'personalize-canvas').slimByDefault === true);
ok('A · personalize-pitch · slimByDefault=true',              CHAIN_PHASES.find(p => p.id === 'personalize-pitch').slimByDefault === true);
ok('A · generate-sops-with-skills · slimByDefault=true',     CHAIN_PHASES.find(p => p.id === 'generate-sops-with-skills').slimByDefault === true);
ok('A · generate-wos-from-sop · slimByDefault=true',          CHAIN_PHASES.find(p => p.id === 'generate-wos-from-sop').slimByDefault === true);

// ─── B · runExpertChain · signature · noves opcions ───────────────────
console.log('\n— B · runExpertChain · noves opcions');
const orchSrc = fs.readFileSync(path.join(ROOT, 'js/core/expertChainOrchestrator.js'), 'utf8');
ok('B · default slim · "auto" (no false)',                   /slim = 'auto'/.test(orchSrc));
ok('B · clarifyBeforeRun option present',                    orchSrc.includes('clarifyBeforeRun ='));
ok('B · clarifyAnswers option present',                      orchSrc.includes('clarifyAnswers ='));
ok('B · gapDetect option · default true',                    /gapDetect = true/.test(orchSrc));
ok('B · embedder option per al dedup',                       /embedder = null/.test(orchSrc));
ok('B · dedupThreshold default 0.85',                        /dedupThreshold = 0\.85/.test(orchSrc));

// ─── C · per-phase slim logic ─────────────────────────────────────────
console.log('\n— C · slim per phase · "auto" mode');
ok('C · slim auto · usa phase.slimByDefault',                 orchSrc.includes("slim === 'auto' ? !!phase.slimByDefault"));
ok('C · slim=true legacy · força true global',                /slim === true   \? true/.test(orchSrc));

// ─── D · landing template post-chain ──────────────────────────────────
console.log('\n— D · landing template generator (no LLM)');
ok('D · _buildLandingFromCanvasAndPitch funció present',      orchSrc.includes('function _buildLandingFromCanvasAndPitch('));
ok('D · landing template · hero { title, tagline, description }', orchSrc.includes('hero:') &&
                                                                   orchSrc.includes('tagline:') &&
                                                                   orchSrc.includes('description:'));
ok('D · landing template · 3 CTAs (Contacta · Pacte · KB)',  orchSrc.includes('Contacta') &&
                                                              orchSrc.includes('Signa un pacte') &&
                                                              orchSrc.includes('Explora KB'));
ok('D · landing post-chain · skip.landing respectat',         orchSrc.includes('if (!skip.landing && (out.canvas || out.pitch))'));
ok('D · _buildPhaseContext · sense personalize-landing',     !orchSrc.includes("phase.id === 'personalize-landing'"));

// ─── E · v148 · clarify wire-up ───────────────────────────────────────
console.log('\n— E · v148 · clarify wire-up');
ok('E · import vnaClarify · enrichContextWithAnswers',        orchSrc.includes("await import('./vnaClarify.js')") &&
                                                              orchSrc.includes('enrichContextWithAnswers'));
ok('E · vnaClarify · emit questions via onEvent',             orchSrc.includes("step: 'clarify'") && orchSrc.includes("status: 'questions'"));
ok('E · clarifyAnswers · merge directe via enrichContextWithAnswers',
                                                              /enrichContextWithAnswers\(context,\s*clarifyAnswers\)/.test(orchSrc));

// ─── F · v148 · gap detection wire-up ─────────────────────────────────
console.log('\n— F · v148 · gap detection post-Phase 5');
ok('F · import vnaGapDetector · detectGaps + runGapFillTurn',orchSrc.includes("await import('./vnaGapDetector.js')") &&
                                                              orchSrc.includes('detectGaps') &&
                                                              orchSrc.includes('runGapFillTurn'));
ok('F · gap detect només a design-value-map-rich',           /phase\.id === 'design-value-map-rich' && gapDetect/.test(orchSrc));
ok('F · gap-fill provider adapter (auto-small)',              orchSrc.includes("generateWithProvider('auto-small'"));
ok('F · emit · gapsDetected + gapsFilled',                    orchSrc.includes('gapsDetected') && orchSrc.includes('gapsFilled'));

// ─── G · v149 · roleDedup wire-up ─────────────────────────────────────
console.log('\n— G · v149 · roleDedup post-Phase 5');
ok('G · import roleDedup · dedupRoles',                       orchSrc.includes("await import('./roleDedup.js')") &&
                                                              orchSrc.includes('dedupRoles'));
ok('G · dedup només si embedder injectat',                   /typeof embedder === 'function'/.test(orchSrc));
ok('G · emit · dedupMerged + rolesBefore/After',              orchSrc.includes('dedupMerged') && orchSrc.includes('rolesBefore'));

// ─── H · v149 · CI workflow ───────────────────────────────────────────
console.log('\n— H · v149 · CI · GitHub Action');
const ciPath = path.join(ROOT, '.github/workflows/prompt-harness.yml');
ok('H · workflow file existeix',                              fs.existsSync(ciPath));
const ci = fs.readFileSync(ciPath, 'utf8');
ok('H · trigger on PR · paths vnaExpertPrompts + domainDetector',
                                                              ci.includes('vnaExpertPrompts.js') && ci.includes('domainDetector.js'));
ok('H · trigger també · knowledge/sectors',                  ci.includes('knowledge/sectors/'));
ok('H · run dry-run sempre (smoke)',                          ci.includes('--harness --dry-run'));
ok('H · run live si ANTHROPIC_API_KEY secret existeix',     ci.includes('secrets.ANTHROPIC_API_KEY'));
ok('H · upload harness report artifact',                     ci.includes('upload-artifact'));

// ─── I · integration · runExpertChain · mock end-to-end ───────────────
console.log('\n— I · integration · mock end-to-end · slim auto');
{
    // Mock provider · retorna JSON simple per a cada task
    const calls = [];
    const mockProvider = async (modelKey, opts) => {
        calls.push({ modelKey, systemLen: (opts.systemPrompt || '').length, taskKindHint: opts.userPrompt?.slice(0, 60) });
        // Retorn que satisfà el parser de _runSingleTask (JSON object)
        return { text: JSON.stringify({
            ok: true,
            // Camps possibles per fase
            product: 'demo product', mission: 'demo mission', values: ['v1', 'v2'],
            problem: 'demo problem', solution: 'demo sol', why_now: 'now',
            roles: [
                { id: 'r1', name: 'Founder', castell_level: 'pom_de_dalt' },
                { id: 'r2', name: 'Customer', castell_level: 'baixos' },
                { id: 'r3', name: 'Ops', castell_level: 'tronc' },
                { id: 'r4', name: 'Reviewer', castell_level: 'laterals' },
                { id: 'r5', name: 'Facilitator', castell_level: 'mans' },
            ],
            transactions: [
                { from: 'r1', to: 'r2', deliverable: 'service', type: 'tangible' },
                { from: 'r2', to: 'r1', deliverable: 'payment', type: 'tangible' },
            ],
            deliverables: [],
            socs: [{ id: 's1', title: 'demo soc' }],
            sops: [{ id: 'sop1', title: 'demo sop' }],
            wos: [{ id: 'wo1', title: 'demo wo' }],
        }), usage: { inputTokens: 500, outputTokens: 200 } };
    };
    const events = [];
    const r = await runExpertChain({
        context: { name: 'Forn Vall', description: 'Forn coop', sector: 'C', vna_zoom: 'mid' },
        generateWithProvider: mockProvider,
        slim: 'auto',
        gapDetect: false,   // off · no carreguem el gap detector amb mock genèric
        onEvent: (e) => events.push(e),
    });
    ok('I · ok=true',                                          r.ok === true);
    ok('I · phasesRun · ≥ 5 (7 fases possibles + landing template)',
                                                                r.phasesRun.length >= 5);
    ok('I · landing generat post-chain (template · no LLM)',   r.landing && r.landing.generatedBy === 'template-canvas-pitch-v147');
    ok('I · landing.cta · 3 entries',                          r.landing.cta.length === 3);
    ok('I · landing.hero.title · nom projecte',                r.landing.hero.title === 'Forn Vall');
    ok('I · events · landing-template emès',                   events.some(e => e.phase === 'landing-template'));
}

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
